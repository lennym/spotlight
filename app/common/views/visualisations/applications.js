define([
  'common/views/visualisations/column',
  'common/views/visualisations/volumetrics/target'
],
function (ColumnView, TargetView) {
  var ApplicationsView = ColumnView.extend({

    initialize: function () {
      ColumnView.prototype.initialize.apply(this, arguments);
    },

    views: function () {
      var valueAttr = this.collection.options.valueAttr;
      var formatOptions = this.collection.options.format;

      return {
        '.summary-number': {
          view: TargetView,
          options: {
            target: this.target,
            pinTo: this.pinTo,
            valueAttr: valueAttr,
            formatOptions: _.extend({}, formatOptions, { abbr: true })
          }
        }
      };

    }

  });

  return ApplicationsView;
});
