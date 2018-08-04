module.exports = class Service {
  /**
   * @param {Sequelize} options.db
   * @param {String} options.name
   */
  constructor(options) {
    Object.assign(this, options);

    const { name } = options;

    this.model = this.db.models[name];
  }

  ERROR_ITEM_NOT_EXISTS = {
    code: 'ITEM_NOT_EXISTS',
    message: 'Item not exists'
  }

  mergeDefaultQueryOptions(options = {}) {
    return options;
  }

  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  async get(id, options = {}) {
    return this.model.findById(id, this.mergeDefaultQueryOptions(options));
  }

  async getOne(where = {}, options = {}) {
    const mergedOptions = Object.assign({}, this.mergeDefaultQueryOptions(options), { where });
    return this.model.findOne(mergedOptions);
  }

  async getAll(where = {}, options = {}) {
    const mergedOptions = Object.assign({}, this.mergeDefaultQueryOptions(options), { where });
    const { limit = this.forceLimit, offset } = mergedOptions;

    if (typeof limit !== 'undefined' && typeof offset !== 'undefined') {
      return this.model.findAndCountAll(mergedOptions);
    }
    return this.model.findAll(mergedOptions);
  }

  // TODO
  // could be optimized
  async getAssociatedData(id, association, options = {}) {
    return this.db.transaction(async transaction => {
      const item = await this.get(id, { transaction });
      if (!item) {
        throw this.ERROR_ITEM_NOT_EXISTS;
      }

      return item[`get${association[0].toUpperCase()}${association.slice(1)}`](Object.assign({}, options, {
        transaction
      }));
    });
  }

  async update(id, data, options = {}) {
    options = Object.assign({ returning: true }, options);
    options.where = Object.assign({}, options.where, { id });
    return this.model.update(data, options);
  }

  async remove(id, options = {}) {
    options.where = Object.assign({}, options.where, { id });
    return this.model.destroy(options);
  }

  /**
   * @param {where} mostly for an owner key as limitation
   */
  async changePriority(item, span, where = {}) {
    if (!span) {
      return;
    }

    const { literal, Op } = this.db;
    const { lt, gt, in: OpIn } = Op;
    const { priorityKey = 'priority' } = this;
    const absSpan = Math.abs(span);
    const sign = span < 0 ? {
      op: lt,
      order: 'ASC',
      direction: 1,
      extremum: 'min'
    } : {
      op: gt,
      order: 'DESC',
      direction: -1,
      extremum: 'max'
    };

    return this.db.transaction(async transaction => {
      const operand = await this.getOne(item, {
        transaction
      });
      if (!operand) {
        return Promise.reject(this.ERROR_ITEM_NOT_EXISTS);
      }

      let target;

      // 如果是有限的变动值
      if (isFinite(span)) {
        const group = await this.model.findAll({
          where: Object.assign({}, where, {
            [priorityKey]: {
              [sign.op]: operand[priorityKey]
            }
          }),
          limit: absSpan,
          offset: 0,
          attributes: ['id', priorityKey],
          order: [
            [priorityKey, sign.order]
          ],
          transaction
        });

        // 如果变动范围内都有元素
        if (group.length >= absSpan) {
          target = group[0][priorityKey];

          await this.model.update({
            [priorityKey]: literal(`${priorityKey} + ${sign.direction}`)
          }, {
            where: {
              id: {
                [OpIn]: group.map(element => element.id)
              }
            },
            transaction
          });
        } else if (!group.length) {
          // 如果变动范围内的元素数比范围小
          // 说明全部数据不足一页
          // target = group[0][priorityKey] - sign.direction;
          // 没有元素无需变动
          return;
        }
      }

      // 如果要求置顶或沉底(未在上一过程中计算出目标值)
      if (typeof target === 'undefined') {
        target = await this.model[sign.extremum](priorityKey, where, {
          transaction
        }) - sign.direction;
      }

      await operand.update({
        [priorityKey]: target
      }, {
        transaction
      });

      return;
    });
  }
}
