define([
  './view',
  'extensions/mixins/formatters'
],
function (View, Formatters) {

  var TableView = View.extend({
    initialize: function (options) {
      this.options = options || {};
      var collection = this.collection = this.options.collection;

      this.valueAttr = this.options.valueAttr;
      this.period = collection.getPeriod();

      View.prototype.initialize.apply(this, arguments);

      this.listenTo(collection, 'reset add remove', this.render);

      if (this.model) {
        this.listenTo(this.model, 'change:sort-by change:sort-order', _.bind(function() {
          this.sort();
        }, this));
      }
    },

    prepareTable: function () {
      var cls,
        caption;

      this.$el.empty();
      cls = (this.options.collapseOnNarrowViewport === true) ? ' class="table-collapsible"' : '';
      caption = (this.options.caption) ? '<caption class="visuallyhidden">' + this.options.caption + '</caption>' : '';
      this.$table = $('<table' + cls + '>' + caption + '</table>');
      this.$table.appendTo(this.$el);
    },

    render: function () {
      this.prepareTable();
      $(this.renderHead()).appendTo(this.$table);
      $(this.renderBody()).appendTo(this.$table);

    },

    renderHead: function () {
      var head = '',
        cls,
        sortOrder = this.model && this.model.get('sort-order'),
        sortUrlParam,
        sortBy = this.model && this.model.get('sort-by');

      head += _.map(this.getColumns(), function (column) {
        var label = column.label;
        var key = column.key;
        if (column.timeshift) {
          label += ' (' + column.timeshift + ' ' + this.period + 's ago)';
        }
        if (_.isArray(column.key)) {
          key = column.key[0];
        }
        if ((sortOrder === 'ascending') || (sortBy !== column.key)) {
          sortUrlParam = 'descending';
        } else {
          sortUrlParam = 'ascending';
        }
        cls = (sortBy === column.key) ? sortOrder + ' sort-column' : '';
        return '<th scope="col" data-key="' + key + '" class="' + cls + '" aria-sort="' + cls + '" role="columnheader"><a class="js-sort" href="?sortby=' + column.key + '&sortorder=' + sortUrlParam + '#filtered-list" role="button">' + label + ' <span class="visuallyhidden">Click to sort</span></a></th>';
      }, this).join('\n');

      return '<thead><tr>' + head + '</tr></thead>';
    },

    renderRow: function (columns, cellContent, index) {
      var column = columns[index],
          className = '',
          sortColClass = '',
          attrs = '',
          tag = 'td';

      if (this.model && this.model.get('sort-by') === column.key) {
        sortColClass = ' sort-column';
      }

      if (column.format) {
        cellContent = this.format(cellContent, column.format);
        className = _.isString(column.format) ? column.format : column.format.type;
      }

      cellContent = (cellContent === null || cellContent === undefined) ?
          '<abbr title="No data provided">—</abbr>' : cellContent;
      if (index === 0) {
        if (this.options.firstColumnIsHeading === true) {
          attrs = ' scope="row"';
          tag = 'th';
        }
      } else {
        attrs = ' data-title="' + column.label + ': "';
      }

      className = ' class="' + className + sortColClass + '"';
      return '<' + tag + attrs + className + ' data-key="' + column.key + '">' + cellContent + '</' + tag + '>';
    },

    renderBody: function (collection) {
      collection = collection || this.collection;
      var columns = this.getColumns(),
          keys = _.pluck(columns, 'key'),
          rows = collection.getTableRows(keys),
          body = '';

      if (rows.length > 0) {
        body += _.map(rows, function (row) {
          var rowContent =
            _.map(row, this.renderRow.bind(this, columns)).join('\n');

          return '<tr>' + rowContent + '</tr>';
        }, this).join('\n');
      } else {
        body += '<tr><td colspan="' + keys.length + '">No data available</td></tr>';
      }

      return '<tbody>' + body + '</tbody>';
    },

    getColumns: function () {
      var cols = [],
        axes = this.collection.options.axes;
      if (axes) {
        cols = _.map(axes.y, function (axis) {
          var column = _.extend({
            key: axis.key || (axis.groupId + ':' + this.valueAttr)
          }, axis);
          if (this.collection.options.isOneHundredPercent) {
            column.key += ':percent';
          }
          if (axis.timeshift) {
            column.key = 'timeshift' + axis.timeshift + ':' + column.key;
          }
          return column;
        }, this);
        if (axes.x) {
          cols.unshift(axes.x);
          this.options.firstColumnIsHeading = true;
        }
      }
      return _.filter(cols);
    },

    sort: function (sortBy, sortOrder) {

      sortBy = sortBy || this.model.get('sort-by');
      sortOrder = sortOrder || this.model.get('sort-order') || 'descending';

      if (!sortBy) {
        return;
      }

      this.collection.comparator = _.bind(function (a, b) {
        var firstVal = a.get(sortBy),
          firstTime = a.get('_timestamp') || a.get('_start_at'),
          secondVal = b.get(sortBy),
          secondTime = b.get('_timestamp') || b.get('_start_at'),
          nullValues = (firstVal === null && secondVal === null),
          ret = 0;

        if (firstVal && typeof firstVal === 'string') {
          firstVal = this.stripLink(firstVal).toLowerCase();
        }
        if (secondVal && typeof secondVal === 'string') {
          secondVal = this.stripLink(secondVal).toLowerCase();
        }

        if (nullValues) {
          if (firstTime < secondTime) {
            ret = -1;
          } else if (firstTime > secondTime) {
            ret = 1;
          }
          if (sortOrder === 'descending') {
            ret = -ret;
          }
        } else {
          if (firstVal === null) {
            ret = 1;
          } else if (secondVal === null) {
            ret = -1;
          } else {
            if (firstVal < secondVal) {
              ret = -1;
            } else if (firstVal > secondVal) {
              ret = 1;
            }
            if (sortOrder === 'descending') {
              ret = -ret;
            }
          }

        }

        return ret;
      }, this);

      this.collection.sort();
    },

    stripLink: function (str) {
      var $link = $(str).filter('a');
      if ($link.length) {
        return $link.html();
      }
      return str;
    },

    mergeSortParams: function(queryString, sortBy, sortOrder) {
      var params = $.deparam(queryString);
      if (sortBy) {
        params.sortby = sortBy;
      }
      if (sortOrder) {
        params.sortorder = sortOrder;
      }

      return $.param(params);
    }

  });

  _.extend(TableView.prototype, Formatters);

  return TableView;
});
