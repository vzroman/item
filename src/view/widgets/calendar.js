import {View} from "../item";
import { Grid } from "../collections/grid.js";
import { Control as Button } from "../controls/button.js";
import { Controller as Collection } from "../../controllers/collection.js";
import { Controller as Item } from "../../controllers/item.js";
import { types } from "../../types/index.js";

import prev from "../../img/prev.svg";
import next from "../../img/next.svg";

import style from "./calendar.css";

export class Calendar extends View {
    #views;

    static options = {
        value: {type: types.primitives.Integer, default: +new Date()}
    };

    constructor(options) {
        super(options);

        this.#views = [
            {view: Month, options: { 
                value: this._options.value, 
                events: { value: (v) => {

                } },
                links: { value: { source: this, event: "value", handler: (v) => {
                    return v;
                } } } }
            },
            {view: Year, options: { 
                value: this._options.value,
                events: { value: (v) => {
                    
                } },
                links: { value: { source: this, event: "value", handler: (v) => {
                    return v;
                } } } }
            }
        ];

        this._viewModeController = new Item({
            schema: { active: { type: types.primitives.Integer } },
            data: { active: 0 }
        });

        this.$calendarMode = undefined;

        this._viewModeController.bind("active", active => {
            const {view, options} = this.#views[active];

            if (this.$calendarMode) {
                this.$calendarMode.destroy();
                this.$calendar.empty();
                this.$calendarMode = undefined;
            }

            this.$calendarMode = new view({ 
                $container: this.$calendar,
                ...options
            });
        });
    }

    markup() {
        const $markup = $(`<div class="${style.calendar}">
            <div name="calendarHeader" class="${style.calendarHeader}">
                <span name="prev"></span>
                <span name="text"></span>
                <span name="next"></span>
            </div>
            <div name="calendarView" class="${style.calendarView}"></div>
        </div>`);

        this.$calendar = $markup.find('[name="calendarView"]');

        return $markup;
    }

    widgets() {
        return {
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
                            let active = this._viewModeController.get("active");
                            active++;
                            this._viewModeController.set({ active });
                        } 
                    },
                    links: {
                        text: { source: "parent", event: ["value"], handler: ({value}) => {
                            return this.$calendarMode.headerText(value);
                        } },
                        // enable: { source: _this._viewModeController, event: ["active"], handler: ({active}) => {
                        //     if (this.#views[active + 1] === undefined) return false;
                        //     return true;
                        // } }
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
        let month = "";

        for (let m = 0; m < 12; m++) {
            month += `<div name="${m}"></div>`;
        }

        return `<div class="${style.year}">${month}</div>`;
    }

    widgets() {
        const _widgets = {};
        
        const year = new Date().getFullYear();

        for (let m = 0; m < 12; m++) {
            let text = new Date(year, m, 1);
            text = text.toLocaleString('default', { month: 'short' });

            _widgets[m] = {
                view: Button, 
                options: {
                    text,
                    events: {
                        click: () => {
                            // TODO
                        }
                    }
                }
            };
        }

        return _widgets;
    }

    headerText( ts ) {
        return new Date( ts ).getFullYear();
    }
}
Year.extend();

class Month extends View {
    static options = {
        value: {type: types.primitives.Integer}
    };

    static markup = "<div name='month'></div>";

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
                prevMonthDays[ Month.getDayName(d) ] = remainingDays + d;
            }
        }

        let data = [];

        let i = 1;

        while (i < numOfDays) {
            const row = {};
            let j;

            for (j = day; j < 7; j++) {
                row[ Month.getDayName(j) ] = i > numOfDays ? i - numOfDays : i;
                i++;
            }

            day = j < 5 ? j + 1 : 0;

            data.push(row);
        }

        data[0] = {...data[0], ...prevMonthDays};

        return data;
    }

    widgets() {
        const data = this._fillDays( this._options.value );
        
        const schema = Month.days.reduce((acc, day) => {
            acc[day] = {type: types.primitives.Integer};
            return acc;
        }, {});

        this._dateController = new Collection({ schema, data });

        this.bind("value", value => {
            const data = this._fillDays( value ).reduce((acc, v, i) => {
                acc[i] = v;
                return acc;
            }, {});

            this._dateController.set(data);
        })

        return {
            month: {
                view: Grid,
                options: {
                    header: ["SU", "MO", "TU", "WE", "TH", "FR", "SA"],
                    columns: Month.days,
                    data: this._dateController
                }
            }
        };
    }

    headerText( ts ) {
        return new Date( ts ).toLocaleString('default', { month: 'long' });
    }
}
Month.extend();