import {Control} from "./control.js";
import {types} from "../../types/index.js";
import styles from "./datetime.css";

import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Russian, English } from "flatpickr/dist/l10n/ru.js";

export class DatePicker extends Control {
    
    static options = {
        selectedDates: { type: types.primitives.Array, default: [] },
        timepicker: { type: types.primitives.Bool, default: true },
        range: { type: types.primitives.Bool, default: false },
        format: { type: types.primitives.String, default: "d.m.Y H:i:S" },
        value: { type: types.primitives.Any },
        min: { type: types.primitives.Integer },
        max: { type: types.primitives.Integer },
        interval: { type: types.primitives.Integer , default: 10},
        disabled: { type: types.primitives.Bool},
        placeholder: { type: types.primitives.String }
    };

    static markup = `<input class="${styles.datepicker}"/>`;

    constructor(options) {
        super(options);
        this._suppressOnChange = false;

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

        this.$markup.on("input", ({ target }) => {
            if (!target?.value) {
                this.set({ value: [] });
            }
        });

        const flatpickrOptions = {
            locale:Russian,
            defaultDate:this._options.value,
            enableTime: this._options.timepicker,
            noCalendar: !this._options.timepicker && !this._options.range,
            time_24hr: true,
            enableSeconds: true,
            dateFormat: this._options.format,
            defaultDate: this._options.selectedDates,
            minDate: this._options.min,
            maxDate: this._options.max,
            minuteIncrement: this._options.interval,
            mode: this._options.range ? "range" : "single",
            onChange: (selectedDates) => {
                if (this._suppressOnChange) return; 

                const timestamps = selectedDates.map(d => d.getTime());
                this.set({ value: timestamps });
            }
        };

        this._widget = flatpickr(this.$markup[0], flatpickrOptions);
    }

    updateValue(value) {
        if (this._widget) {
            const date = Array.isArray(value)
                ? value.map(ts => new Date(ts))
                : date;

            this._suppressOnChange = true;
            if(date){
                this._widget.setDate(new Date(date), true);
            }
            this._suppressOnChange = false;
        }
    }
}

DatePicker.extend();
