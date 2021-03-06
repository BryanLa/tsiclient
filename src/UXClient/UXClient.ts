import {LineChart} from "./Components/LineChart/LineChart";
import {PieChart} from "./Components/PieChart/PieChart";
import {GroupedBarChart} from "./Components/GroupedBarChart/GroupedBarChart";
import {Grid} from "./Components/Grid/Grid";
import {Slider} from "./Components/Slider/Slider";
import {EventSeries} from "./Components/EventSeries/EventSeries";
import {StateSeries} from "./Components/StateSeries/StateSeries";
import {Hierarchy} from "./Components/Hierarchy/Hierarchy";
import {AggregateExpression} from "./Models/AggregateExpression";
import {Heatmap} from "./Components/Heatmap/Heatmap";
import {EventsTable} from "./Components/EventsTable/EventsTable";
import {Utils} from "./Utils";
import './styles.scss'

class UXClient {
    UXClient () {
    }

    public PieChart(renderTarget) {
        return new PieChart(renderTarget);
    }
    
    public BarChart(renderTarget){
        return new GroupedBarChart(renderTarget);
    }

    public LineChart(renderTarget){
        return new LineChart(renderTarget);
    }
    
    public Grid(renderTarget){
        return new Grid(renderTarget);
    }
    
    public Slider(renderTarget){
        return new Slider(renderTarget);
    }

    public EventSeries(renderTarget) {
        return new EventSeries(renderTarget);
    }

    public StateSeries(renderTarget) {
        return new StateSeries(renderTarget);
    }

    public Hierarchy(renderTarget) {
        return new Hierarchy(renderTarget);
    }

    public AggregateExpression(predicateObject: any, measureObject: any, measureTypes: Array<string>, searchSpan: any, 
                                        splitByObject: any = null, color: string = null, alias: string = '', contextMenu: Array<any> = []): any {
        return new AggregateExpression(predicateObject, measureObject, measureTypes, searchSpan, splitByObject, color, alias, contextMenu)
    }

    public Heatmap(renderTarget) {
        return new Heatmap(renderTarget);
    }

    public EventsTable(renderTarget) {
        return new EventsTable(renderTarget);
    }

    public transformTSXToEventsArray (events, options) {
        var timezoneOffset = options.timezoneOffset ? options.timezoneOffset : 0;
        var rows = [];
        var eventSourceProperties = {};
        var nameToStrippedPropName = {};
        var valueToStrippedValueMap = {};
        for (var eventIdx in events) {
            var eventSourceId;
            if (events[eventIdx].hasOwnProperty('schema')) {
                eventSourceProperties[events[eventIdx].schema.rid] = {};
                eventSourceProperties[events[eventIdx].schema.rid].propertyNames = events[eventIdx].schema.properties.reduce(function(prev, curr) {
                    prev.push({ name: curr.name, type: curr.type });
                    return prev;
                }, []);
                eventSourceProperties[events[eventIdx].schema.rid].eventSourceName = events[eventIdx].schema['$esn'];
                eventSourceId = events[eventIdx].schema.rid;
            } else {
                eventSourceId = events[eventIdx].schemaRid;
            }

            var timeStamp = (new Date((new Date(events[eventIdx]['$ts'])).valueOf() - timezoneOffset)).toISOString().slice(0,-1).replace('T', ' ');
            var event = { timestamp: timeStamp };

            // lts logic
            var lts = events[eventIdx]['$lts'] ? events[eventIdx]['$lts'] : null;
            if (lts) {
                event['LocalTimestamp_DateTime'] = {
                    value: lts.replace('T', ' '),
                    name: 'LocalTimestamp',
                    type: 'DateTime'
                }
            }

            // event[this.getColumnNameAndType('EventSourceName', 'String')] = eventSourceProperties[eventSourceId].eventSourceName;
            event["EventSourceName_String"] = {
                value: eventSourceProperties[eventSourceId].eventSourceName,
                name: 'EventSourceName',
                type: 'String'
            };
            for (var propIdx in eventSourceProperties[eventSourceId].propertyNames) {
                var name = eventSourceProperties[eventSourceId].propertyNames[propIdx].name;
                if (!nameToStrippedPropName.hasOwnProperty(name))
                    nameToStrippedPropName[name] = Utils.stripForConcat(name);
                var strippedName = nameToStrippedPropName[name];
                var type = eventSourceProperties[eventSourceId].propertyNames[propIdx].type;
                var columnNameAndType = strippedName + "_" + type;//Models.GridColumn.getColumnNameAndType(strippedName, type);
                if (!valueToStrippedValueMap.hasOwnProperty(String(events[eventIdx].values[propIdx])))
                    valueToStrippedValueMap[String(events[eventIdx].values[propIdx])] = Utils.stripForConcat(String(events[eventIdx].values[propIdx]));
                var eventObject = {
                    value: valueToStrippedValueMap[String(events[eventIdx].values[propIdx])],
                    name: strippedName,
                    type: type
                }
                event[columnNameAndType] = eventObject;
            }
            rows.push(event);
        }
        return rows;
    }
    
    public transformAggregatesForVisualization(aggregates: Array<any>, options): Array<any> {
        var result = [];
        aggregates.forEach((agg, i) => {
            var transformedAggregate = {};
            var aggregatesObject = {};
            transformedAggregate[options[i].alias] = aggregatesObject;
            
            if(agg.hasOwnProperty('aggregate')){
                agg.dimension.forEach((d, j) => {
                    var dateTimeToValueObject = {};
                    aggregatesObject[d] = dateTimeToValueObject;
                    agg.aggregate.dimension.forEach((dt, k) => {
                        var measuresObject = {};
                        dateTimeToValueObject[dt] = measuresObject;
                        options[i].measureTypes.forEach((t,l) => {
                            if (agg.aggregate.measures[j][k] && agg.aggregate.measures[j][k][l])
                                measuresObject[t] = agg.aggregate.measures[j][k][l];
                            else
                                measuresObject[t] = null;
                        }) 
                    })
                })
            }
            else{
                var dateTimeToValueObject = {};
                aggregatesObject[''] = dateTimeToValueObject;
                agg.dimension.forEach((dt,j) => {
                    var measuresObject = {};
                    dateTimeToValueObject[dt] = measuresObject;
                    options[i].measureTypes.forEach((t,l) => {
                        measuresObject[t] = agg.measures[j][l];
                    }) 
                })     
            }
            
            result.push(transformedAggregate);
        });
        return result;
    }
}


export {UXClient}