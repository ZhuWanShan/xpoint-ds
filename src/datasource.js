import _ from "lodash";
import $ from 'jquery';

export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    window["XPOINT_TOKEN"] = 'test_token_201_11';
  }

  // Called once per panel (graph)
  query(options) {

    if(!options
      || !options.targets
      || options.targets.length < 1
      || !options.targets[0].target){
      return {data: []};
    }

    let timeScope = this.timeScope();
    let xpointFuncs = this.allXPointFunc(options.targets);

    let self = this;
    let queries = _.map(xpointFuncs, function (xpointFunc) {
      var paramData = {};
      paramData.from = timeScope.from;
      paramData.to = timeScope.to;
      paramData.func = xpointFunc.func;
      paramData["fun-param"] = xpointFunc.params;
      paramData.format = xpointFunc.format;
      paramData.token =  window["XPOINT_TOKEN"];
      let param =  $.param(paramData, true);
      return  self.backendSrv.datasourceRequest({
        url: self.url + '/json?' + param,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    });

    return Promise.all(queries).then(function (rs) {
      return {
        data: _.map(rs, function (r) {
          return r.data;
        })
      }
    });
  }

  // Required
  // Used for testing datasource in datasource configuration pange
  testDatasource() {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/test',
      method: 'GET'
    }).then(response => {
      if (response.status === 200) {
        return { status: "success", message: "Data source is working", title: "Success" };
      }
    });
  }


  annotationQuery(options) {

  }

  // Optional
  // Required for templating
  metricFindQuery(options) {

    if(!options || options.length < 1){
      return {data: []};
    }

    var paramData = {};

    let timeScope = this.timeScope();
    let xpointFunc = this.xpointFunc(options);

    paramData.from = timeScope.from;
    paramData.to = timeScope.to;
    paramData.func = xpointFunc.func;
    paramData["fun-param"] = xpointFunc.params;
    paramData.format = xpointFunc.format;
    paramData.token =  window["XPOINT_TOKEN"];

    let param =  $.param(paramData, true);

    return this.backendSrv.datasourceRequest({
      url: this.url + '/template?' + param,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(function (rs) {
      return _.map(rs.data, function (d) {
        return { text: d[0], value : d[1]}
      })
    });
  }

  allXPointFunc(targets) {

    let self = this;

    targets = _.filter(targets, target => {
      return target.target !== '' && !target.hide;
    });

    return _.map(targets, target => self.xpointFunc(target.target));
  }

  timeScope(){
    let timeRange = angular.element('grafana-app').injector().get('timeSrv').timeRange();
    return {
      from: timeRange.from.toDate().getTime(),
      to: timeRange.to.toDate().getTime()
    }
  }

  xpointFunc(target){
    if(!target || target.length < 2){
      throw "Target is not Valid";
    }

    target = target.split(':');

    if(target.length < 1){
      throw "Target is not Valid";
    }
    
    let funName = target[0];
    
    var params = [];
    var format = "";

    if(target.length > 1) {
      params = target[1].split('|')[0].split(',');
      if(target[1].split('|').length > 1){
        format = target[1].split('|')[1];
      }
    }

    let self = this;

    params = _.map(params, function (p) {
      if(p.startsWith('$')){
        let variable = self.templateSrv.variables.find(function (f) {
          return '$' + f.name == p;
        });
        if(variable){
          return variable.current.value;
        }else{
          return "";
        }
      }else{
        return p;
      }
    });

    return {
      func: funName,
      params: params,
      format: format
    }
  }
}
