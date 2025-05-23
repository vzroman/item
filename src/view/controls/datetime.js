import {Control} from "./control.js";
import {types} from "../../types/index.js";
import AirDatepicker from 'air-datepicker'
import 'air-datepicker/air-datepicker.css';
import styles from "./datetime.css";


export class DatePicker extends Control {

    static options = {
        selectedDates:    { type: types.primitives.Array, default: []},
        timepicker:       { type: types.primitives.Bool, default: false },
        range:            { type: types.primitives.Bool, default: false },
        format:           { type: types.primitives.String, default: "dd.MM.yyyy" },
        timeFormat:       { type: types.primitives.String },
        value:            { type: types.primitives.Array },
        min:              { type: types.primitives.Any },
        max:              { type: types.primitives.Any },
        interval:         { type: types.primitives.Integer, default: 30 },
        disableDates:     { type: types.primitives.Fun },
        placeholder:      { type: types.primitives.String}
    };

    static markup = `<input class= "${styles.datepicker}"/>`;

    constructor(options) {
        super(options);

        this.bind("placeholder",value => {
            if (value){
                this.$markup.prop("placeholder", value);
            }else{
                this.$markup.removeAttr("placeholder");
            }
        });

        this.$markup.on("input", ({target}) => {
            if(!target?.value){
                this.set({value: []})
            }
        })

        this._widget = new AirDatepicker(this.$markup[0], {
            selectedDates: this._options.selectedDates,
            timepicker: this._options.timepicker,
            range: this._options.range,
            dateFormat: this._options.format,
            minDate: this._options.min,
            maxDate: this._options.max,
            styles:{
                zIndex:100000
            },
            classes:styles.air_datepicker,
            autoClose: false,
            onSelect: ({ date }) => {
                if (Array.isArray(date)) {
                    const [start, end] = date;
                
                    const validStart = start instanceof Date && !isNaN(start);
                    const validEnd = end instanceof Date && !isNaN(end);
                
                    if (validEnd) {
                        end.setHours(23, 59, 59, 999); // установить конец дня
                    }
                
                    const timestamps = [
                        validStart ? start.getTime() : null,
                        validEnd ? end.getTime() : null
                    ].filter(ts => ts !== null);
                
                    this.set({ value: timestamps });                
                } else if (date instanceof Date && !isNaN(date)) {
                    this.set({ value: [date.getTime()] });
                }
                
            }
            
        });
    }
}
DatePicker.extend();
