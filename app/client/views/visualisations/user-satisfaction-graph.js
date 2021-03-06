define([
  'client/views/visualisations/completion-rate',
  'client/views/visualisations/bar-chart/user-satisfaction',
  'common/views/visualisations/volumetrics/number',
  'extensions/collections/collection'
],
function (SingleTimeseriesView, UserSatisfactionView, VolumetricsNumberView, Collection) {
  return SingleTimeseriesView.extend({

    valueAttr: 'rating',

    formatOptions: {
      type: 'percent'
    },

    initialize: function () {
      this.userSatisfactionCollection = new Collection(this.getBreakdown(), { format: 'integer' });

      SingleTimeseriesView.prototype.initialize.apply(this, arguments);

      this.listenTo(this.collection, 'change:selected', this.onChangeSelected, this);
    },

    onChangeSelected: function (selectModel) {
      var ratings = this.getBreakdown(selectModel);
      this.userSatisfactionCollection.reset(ratings);
      this.populateBreakdownLabel(selectModel);
      this.populateResponses(selectModel);
    },

    render: function () {
      SingleTimeseriesView.prototype.render.apply(this, arguments);

      this.populateBreakdownLabel();

      this.populateResponses();
    },

    populateBreakdownLabel: function (selectModel) {
      if (this.model.get('parent').get('page-type') === 'module') {
        var output = '';

        if (selectModel) {
          output = VolumetricsNumberView.prototype.getLabel.call(this, selectModel) || 'no-data';
        }
        this.$el.find('.volumetrics-bar-period').html(output);
      }
    },

    populateResponses: function (selectModel) {
      var model = selectModel || this.collection.lastDefined('total:sum'),
          output = '';

      if (model) {
        if (model.get(this.totalAttr)) {
          output = '(' + model.get(this.totalAttr) + ' total responses)';
        } else {
          output = 'no-data';
        }
      }
      this.$el.find('.total-responses').html(output);
    },

    getPeriod: function () {
      return this.collection.getPeriod() || 'week';
    },

    getBreakdown: function (selectModel) {
      if (selectModel) {
        selectModel = _.isArray(selectModel) ? selectModel[0] : selectModel;
      }

      return _.map(
          this.collection.options.axes.y.slice(1),
          function (axis) {
            var val;
            if (selectModel) {
              val = selectModel.get(axis.key);
            } else {
              val = this.collection.total(axis.key);
            }
            return {
              count: val,
              title: axis.label,
            };
          }, this
      );
    },

    views: function () {
      var views = SingleTimeseriesView.prototype.views.apply(this, arguments);
      if (this.model.get('parent').get('page-type') === 'module') {
        views['.volumetrics-bar-selected'] = {
          view: UserSatisfactionView,
          options: {
            valueAttr: 'count',
            collection: this.userSatisfactionCollection,
            formatOptions: this.formatOptions || 'integer'
          }
        };
      }

      return views;
    }
  });
});
