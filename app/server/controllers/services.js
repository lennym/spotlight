var requirejs = require('requirejs');
var Backbone = require('backbone');
var sanitizer = require('sanitizer');

var View = require('../views/services');
var ErrorView = require('../views/error');

var ServicesCollection = requirejs('common/collections/services');
var Collection = requirejs('extensions/collections/collection');
var PageConfig = requirejs('page_config');

var get_dashboard_and_render = require('../mixins/get_dashboard_and_render');

var dataSource = {
  'data-group': 'service-aggregates',
  'data-type': 'latest-dataset-values',
  'query-params': {
    'sort_by': '_timestamp:descending'
  }
};

var renderContent = function (req, res, client_instance) {

  var services = new ServicesCollection(client_instance.get('items')).filterDashboards(ServicesCollection.SERVICES),
    collection;
  var transactions = new Collection([], {dataSource: dataSource});

  transactions.on('sync', function () {
    services = formatCollectionData(services);
    services = addServiceDataToCollection(services,  transactions.toJSON());
    collection = new ServicesCollection(services, servicesController.serviceAxes);

    var departments = collection.getDepartments();
    var agencies = collection.getAgencies();

    var model = new Backbone.Model(_.extend(PageConfig.commonConfig(req), {
      title: 'Services data',
      'page-type': 'services',
      filter: sanitizer.escape(req.query.filter || ''),
      departmentFilter: req.query.department || null,
      departments: departments,
      agencies: agencies,
      data: services,
      script: true,
      noun: 'service',
      axesOptions: servicesController.serviceAxes,
      'sort-by':  sanitizer.escape(req.query.sortby || 'number_of_transactions'),
      'sort-order':  sanitizer.escape(req.query.sortorder || 'descending')
    }));

    var client_instance_status = client_instance.get('status');
    var view;
    if (client_instance_status === 200) {
      view = new View({
        model: model,
        collection: collection
      });
    } else {
      view = new ErrorView({
        model: model,
        collection: collection
      });
    }
    view.render();
    res.set('Cache-Control', 'public, max-age=7200');
    res.send(view.html);
  });

  transactions.fetch();

};

function formatCollectionData(services) {
  var kpis = {
    'total_cost': null,
    'number_of_transactions': null,
    'cost_per_transaction': null,
    'tx_digital_takeup': null,
    'digital_takeup': null,
    'completion_rate': null,
    'user_satisfaction_score': null
  };
  _.each(services, function (service) {
    _.extend(service, kpis);
    service.titleLink = '<a href="/performance/' + service.slug + '">' + service.title + '</a>';
  });
  return services;
}

function addServiceDataToCollection (services, serviceData) {
  var dashboard;

  _.each(serviceData, function (item) {
    var slug = item.dashboard_slug;

    // only bother looking for the dashboard if we don't already have it
    if (!dashboard || (dashboard.slug !== slug)) {
      dashboard = _.findWhere(services, {
        slug: slug
      });
    }
    if (dashboard) {
      delete item._id;
      delete item._timestamp;
      delete item.dashboard_slug;
      _.extend(dashboard, item);
    }

  });
  return services;
}

function servicesController (req, res) {
  var client_instance = get_dashboard_and_render(req, res, renderContent);
  client_instance.setPath('');
}

servicesController.serviceAxes = {
  axes: {
    x: {
      key: 'titleLink',
      label: 'Service name'
    },
    y: [
      {
        key: 'number_of_transactions',
        label: 'Transactions per year',
        format: 'integer'
      },
      {
        key: 'total_cost',
        label: 'Annual cost',
        format: 'currency'
      },
      {
        label: 'Cost per transaction',
        key: 'cost_per_transaction',
        format: {
          type: 'currency',
          pence: true
        }
      },
      {
        label: 'Digital take-up',
        key: 'digital_takeup',
        format: {
          type: 'percent',
          dps: 1,
          fixed: 1
        }
      },
      {
        label: 'User satisfaction',
        key: 'user_satisfaction_score',
        format: {
          type: 'percent',
          dps: 1,
          fixed: 1
        }
      },
      {
        label: 'Completion rate',
        key: 'completion_rate',
        format: {
          type: 'percent',
          dps: 1,
          fixed: 1
        }
      }
    ]
  }
};

module.exports = servicesController;