import {Control} from "./control.js";
import {types} from "../../types/index.js";
import styles from "./datetime.css";

import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { flatpickrLocales } from "./datePicker/localizationMap.js";



export class DatePicker extends Control {
    
    static options = {
        selectedDates: { type: types.primitives.Array, default: [] },
        timepicker: { type: types.primitives.Bool, default: true },
        noCalendar: { type: types.primitives.Bool, default: false },
        range: { type: types.primitives.Bool, default: false },
        format: { type: types.primitives.String, default: "d.m.Y H:i:S" },
        value: { type: types.primitives.Any , default: new Date()},
        min: { type: types.primitives.Integer },
        max: { type: types.primitives.Integer },
        minTime: { type: types.primitives.String },
        maxTime: { type: types.primitives.String },
        interval: { type: types.primitives.Integer , default: 1},
        disabled: { type: types.primitives.Bool},
        enableSeconds: { type: types.primitives.Bool},
        placeholder: { type: types.primitives.String },
        localization: { type: types.primitives.String, default:"loc_kz" }
    };


    static markup = `<input class="${styles.datepicker}"/>`;

    constructor(options) {
        super(options);
        this._suppressOnChange = false;

        const {value, timepicker, noCalendar, range, format, min, max, minTime, maxTime, interval, localization, enableSeconds } = this._options;
        const locale = flatpickrLocales[localization] || flatpickrLocales["loc_en"];
        
        this.bind("placeholder", value => {
            if (value) {
                this.$markup.prop("placeholder", value);
            } else {
                this.$markup.removeAttr("placeholder");
            }
        });

        this.bind("disabled", value => {
            this.$markup.prop("disabled", value);
        });

        this.bind("minTime", value => {
            this._widget?.set("minTime", value || null);
        });

        this.bind("maxTime", value => {
            this._widget?.set("maxTime", value || null);
        });

        const flatpickrOptions = {
            locale,
            defaultDate: value,
            enableTime: timepicker,
            noCalendar: noCalendar,
            time_24hr: true,
            enableSeconds: enableSeconds ?? true,
            dateFormat: format,
            minDate: min,
            maxDate: max,
            minTime: minTime,
            maxTime: maxTime,
            minuteIncrement: interval,
            mode: range ? "range" : "single",
            onChange: (selectedDates) => {
                if (this._suppressOnChange) return; 

                let timestamps = selectedDates.map(d => d.getTime());

                // If timepicker ONLY mode
                if (this._options.noCalendar && this._options.timepicker) {
                    timestamps = selectedDates.map(d => flatpickr.formatDate(new Date(d), "H:i"));
                    this.set({ value: timestamps[0] });
                    return;
                }

                this.set({ value: timestamps });
            }
        };

        this._widget = flatpickr(this.$markup[0], flatpickrOptions);
    }

    updateValue(value) {
        if (this._widget && value) {
            let date = Array.isArray(value)
                ? value.map(ts => new Date(ts))
                : new Date(value);

            if (this._options.noCalendar && this._options.timepicker) {
                date = value;
            }

            this._suppressOnChange = true;

            this._widget.setDate(date, false);

            this._suppressOnChange = false;
        }
    }
}

DatePicker.extend();
