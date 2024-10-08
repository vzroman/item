import {View} from "../item";
import { Grid } from "../collections/grid.js";
import { Control as Button } from "../controls/button.js";
import { Controller as Collection } from "../../controllers/collection.js";
import { Controller as ItemController } from "../../controllers/item.js";
import { Label } from "../primitives/label.js";
import { types } from "../../types/index.js";

import prev from "../../img/prev.svg";
import next from "../../img/next.svg";

import style from "./calendar.css";

export class Calendar extends View {
    static options = {
        value: {type: types.primitives.Integer, default: +new Date()}
    };

    static markup = `<div class="${style.calendar}">
        <div name="calendarHeader" class="${style.calendarHeader}">
            <span name="prev"></span>
            <span name="text"></span>
            <span name="next"></span>
        </div>
        <div name="calendarView" class="${style.calendarView}"></div>
    </div>`;

    static days = ["su", "mo", "tu", "we", "th", "fr", "sa"];

    static getDayName(dayIndex) {
        return this.days[dayIndex];
    } 

    _fillDays( ts ) {
        const value = new Date( ts );

        const year = value.getFullYear();
        const month = value.getMonth();

        const numOfDays = new Date(year, month + 1, 0).getDate();
        
        let day = new Date(year, month).getDay();

        const prevMonthDays = {};

        if (day > 0) {
            let remainingDays = new Date(year, month, 0).getDate() - day + 1;

            for (let d = 0; d < day; d++) {
                prevMonthDays[ Calendar.getDayName(d) ] = remainingDays + d;
            }
        }

        let data = [];

        let i = 1;

        while (i < numOfDays) {
            const row = {};
            let j;

            for (j = day; j < 7; j++) {
                row[ Calendar.getDayName(j) ] = i > numOfDays ? i - numOfDays : i;
                i++;
            }

            day = j < 5 ? j + 1 : 0;

            data.push(row);
        }

        data[0] = {...data[0], ...prevMonthDays};

        return data;
    }

    _prev() {

    }

    _next() {

    }

    widgets() {
        const data = this._fillDays( this._options.value );        

        this._dateController = new Collection({
            schema:{
                "su":{type:types.primitives.Integer},
                "mo":{type:types.primitives.Integer},
                "tu":{type:types.primitives.Integer},
                "we":{type:types.primitives.Integer},
                "th":{type:types.primitives.Integer},
                "fr":{type:types.primitives.Integer},
                "sa":{type:types.primitives.Integer}
            },
            data
        });

        this._viewModeController = new ItemController({
            schema: {
                depth: { type: types.primitives.Integer },
                mode: { type: types.primitives.Array } // month | year | decade | century
            },
            data: {
                depth: 0
            }
        });

        return {
            calendarView: {
                view: Year,
                // options: {
                //     header: ["SU", "MO", "TU", "WE", "TH", "FR", "SA"],
                //     columns: Calendar.days,
                //     data: this._dateController
                // }
            },
            // calendarView: {
            //     view: Grid,
            //     options: {
            //         header: ["SU", "MO", "TU", "WE", "TH", "FR", "SA"],
            //         columns: Calendar.days,
            //         data: this._dateController
            //     }
            // },
            prev: {
                view: Button,
                options:{
                    events:{
                        click: () => {
                            // todo
                        } 
                    },
                    icon: `url("${ prev }")`
                }
            },
            next: {
                view: Button,
                options:{
                    events:{
                        click: () => {
                            // todo
                        } 
                    },
                    icon: `url("${ next }")`
                }
            },
            text: {
                view: Button,
                options:{
                    events:{
                        click: () => {
                            // todo
                        } 
                    },
                    links: {
                        text: { source: this._viewModeController, event: ["depth"], handler: ({depth}) => {
                            // if (depth === "month") {
                            // }
                            return new Date(this._options.value).toLocaleString('default', { month: 'long' });
                        } }
                    },
                    css: {
                        "font-size": "16px"
                    }
                }
            }
        };
    }

}
Calendar.extend();

class Year extends View {

    markup() {
        let months = "";

        for (let m = 0; m < 12; m++) {
            months += `<div name="${m}"></div>`;
        }

        return `<div class="${style.year}">${months}</div>`;
    }

    widgets() {
        const _widgets = {};
        
        const year = new Date().getFullYear();

        for (let m = 0; m < 12; m++) {
            let text = new Date(year, m, 1);
            text = text.toLocaleString('default', { month: 'short' });

            _widgets[m] = {
                view: Label, 
                options: {
                    text,
                    events: {
                        click: () => {

                        }
                    }
                }
            };
        }

        return _widgets;
    }
}
Year.extend();