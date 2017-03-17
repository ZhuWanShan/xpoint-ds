"use strict";

System.register(["lodash", "jquery"], function (_export, _context) {
  "use strict";

  var _, $, _createClass, GenericDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export("GenericDatasource", GenericDatasource = function () {
        function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, GenericDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.q = $q;
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
          window["XPOINT_TOKEN"] = 'test_token_201_11';
        }

        // Called once per panel (graph)


        _createClass(GenericDatasource, [{
          key: "query",
          value: function query(options) {

            if (!options || !options.targets || options.targets.length < 1 || !options.targets[0].target) {
              return { data: [] };
            }

            var timeScope = this.timeScope();
            var xpointFuncs = this.allXPointFunc(options.targets);

            var self = this;
            var queries = _.map(xpointFuncs, function (xpointFunc) {
              var paramData = {};
              paramData.from = timeScope.from;
              paramData.to = timeScope.to;
              paramData.func = xpointFunc.func;
              paramData["fun-param"] = xpointFunc.params;
              paramData.format = xpointFunc.format;
              paramData.token = window["XPOINT_TOKEN"];
              var param = $.param(paramData, true);
              return self.backendSrv.datasourceRequest({
                url: self.url + '/json?' + param,
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
            });

            return Promise.all(queries).then(function (rs) {
              return {
                data: _.map(rs, function (r) {
                  return r.data;
                })
              };
            });
          }
        }, {
          key: "testDatasource",
          value: function testDatasource() {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/test',
              method: 'GET'
            }).then(function (response) {
              if (response.status === 200) {
                return { status: "success", message: "Data source is working", title: "Success" };
              }
            });
          }
        }, {
          key: "annotationQuery",
          value: function annotationQuery(options) {}
        }, {
          key: "metricFindQuery",
          value: function metricFindQuery(options) {

            if (!options || options.length < 1) {
              return { data: [] };
            }

            var paramData = {};

            var timeScope = this.timeScope();
            var xpointFunc = this.xpointFunc(options);

            paramData.from = timeScope.from;
            paramData.to = timeScope.to;
            paramData.func = xpointFunc.func;
            paramData["fun-param"] = xpointFunc.params;
            paramData.format = xpointFunc.format;
            paramData.token = window["XPOINT_TOKEN"];

            var param = $.param(paramData, true);

            return this.backendSrv.datasourceRequest({
              url: this.url + '/template?' + param,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }).then(function (rs) {
              return _.map(rs.data, function (d) {
                return { text: d[0], value: d[1] };
              });
            });
          }
        }, {
          key: "allXPointFunc",
          value: function allXPointFunc(targets) {

            var self = this;

            targets = _.filter(targets, function (target) {
              return target.target !== '' && !target.hide;
            });

            return _.map(targets, function (target) {
              return self.xpointFunc(target.target);
            });
          }
        }, {
          key: "timeScope",
          value: function timeScope() {
            var timeRange = angular.element('grafana-app').injector().get('timeSrv').timeRange();
            return {
              from: timeRange.from.toDate().getTime(),
              to: timeRange.to.toDate().getTime()
            };
          }
        }, {
          key: "xpointFunc",
          value: function xpointFunc(target) {
            if (!target || target.length < 2) {
              throw "Target is not Valid";
            }

            target = target.split(':');

            if (target.length < 1) {
              throw "Target is not Valid";
            }

            var funName = target[0];

            var params = [];
            var format = "";

            if (target.length > 1) {
              params = target[1].split('|')[0].split(',');
              if (target[1].split('|').length > 1) {
                format = target[1].split('|')[1];
              }
            }

            var self = this;

            params = _.map(params, function (p) {
              if (p.startsWith('$')) {
                var variable = self.templateSrv.variables.find(function (f) {
                  return '$' + f.name == p;
                });
                if (variable) {
                  return variable.current.value;
                } else {
                  return "";
                }
              } else {
                return p;
              }
            });

            return {
              func: funName,
              params: params,
              format: format
            };
          }
        }]);

        return GenericDatasource;
      }());

      _export("GenericDatasource", GenericDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
