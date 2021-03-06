var requirejs = require('requirejs');
var Backbone = require('backbone');
var ServicesCollection = requirejs('common/collections/services');
var ServicesView = require('../../../app/server/views/services');
var servicesController = require('../../../app/server/controllers/services');

var BaseView = require('../../../app/server/views/govuk');
var TableView = requirejs('extensions/views/table');

describe('Services View', function () {

  var view, model, collection;

  beforeEach(function () {
    model = new Backbone.Model({
      axesOptions: servicesController.serviceAxes.axes
    });

    collection = new ServicesCollection([{
      title: 'Prescriptions: prepayment certificates issued',
      department: {
        title: 'Department of Health',
        abbr: 'DH'
      },
      agency: {
        title: 'NHS Business Services Authority',
        abbr: 'NHSBSA'
      },
      completion_rate: 0.4,
      number_of_transactions: 2000
    }], servicesController.serviceAxes);

    view = new ServicesView({
      model: model,
      collection: collection
    });
  });

  it('extends govuk view', function () {
    expect(view instanceof BaseView).toBe(true);
  });

  describe('getPageTitle', function () {

    it('returns services page title', function () {
      expect(view.getPageTitle()).toEqual('Services data - GOV.UK');
    });

  });

  describe('getBreadcrumbCrumbs', function () {

    it('returns breadcrumbs', function () {
      expect(view.getBreadcrumbCrumbs().length).toEqual(2);
      expect(view.getBreadcrumbCrumbs()[0]).toEqual({
        path: '/performance',
        title: 'Performance'
      });
      expect(view.getBreadcrumbCrumbs()[1]).toEqual({
        title: 'Services data'
      });
    });

  });

  describe('getContent', function () {

    beforeEach(function () {
      spyOn(TableView.prototype, 'initialize');
      spyOn(TableView.prototype, 'render').andCallFake(function () {
        this.$el.html('<div id="list"></div>');
      });
      spyOn(ServicesView.prototype, 'loadTemplate');
    });

    it('instantiates a TableView', function () {
      view.getContent();
      expect(TableView.prototype.initialize).toHaveBeenCalled();
    });

    it('renders the TableView into the template', function () {
      view.getContent();
      var options = view.loadTemplate.mostRecentCall.args[1];
      expect(options.table).toEqual('<div id="list"></div>');
    });

  });

  describe('formatAggregateValues', function () {

    it('adds a formatted value for kpis with a weighted_average', function () {
      expect(view.formatAggregateValues()[5].formattedValue).toEqual('40%');
    });

    it('ensures all results are present even for ones with no values', function () {
      expect(view.formatAggregateValues()[0].key).toEqual('number_of_transactions');
      expect(view.formatAggregateValues()[1].key).toEqual('total_cost');
      expect(view.formatAggregateValues()[2].key).toEqual('cost_per_transaction');
      expect(view.formatAggregateValues()[3].key).toEqual('digital_takeup');
      expect(view.formatAggregateValues()[4].key).toEqual('user_satisfaction_score');
      expect(view.formatAggregateValues()[5].key).toEqual('completion_rate');
    });

  });

});
