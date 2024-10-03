import {Control as Parent} from "./control.js";
import {types} from "../../types/index.js";
import {Controller} from "../../controllers/collection.js";
import {Control as Button} from "./button.js";

import calendar from "../../img/calendar.svg";
import style from "./datepicker.css";

export class Control extends Parent {
    static markup = `<span class="${style.datepicker}">
        <input class="${style.datepicker_input}" type="text" />
        <span name="toggle_calendar"></span>
    </span>`;

    widgets() {
        return {
            toggle_calendar: {
                view: Button,
                options: {
                    events:{
                        click:() => {
                            // todo.
                        } 
                    },
                    icon: `url("${ calendar }")`,
                    css: {
                        "border-color": "rgba(0, 0, 0, 0.08)",
                        "color": "#424242",
                        "background-color": "#f5f5f5",
                        "gap": "0px",
                        "border-width": 0,
                        "border-inline-start-width": "1px"
                    }
                }
            }
        };
    }
}
Control.extend();