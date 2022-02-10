//-----------------------------------------------------------------
// Copyright (c) 2022, Faceplate LTD. All Rights Reserved.
// Author: Vozzhenikov Roman, vzroman@gmail.com
//-----------------------------------------------------------------
import {types} from "../../types/index.js";
import {View as Parent} from "../../view/item.js";
import {Control} from "../controls/control.js";
import {Primitive as Label} from "../primitives/label.js";
import {text} from "../../i18n/i18n.js";
import style from "./formField.css";


export class View extends Parent{

    static options = {
        name:{type: types.primitives.String },
        value:{type: types.complex.Item, options:{schema:{
            view:{type:types.primitives.Class, options:{ class:Control } },
            options:{type: types.primitives.Set }
        }}, required:true }
    };

    static markup = `<div class="${ style.field }">
            <div class="${ style.name }" name="name"></div>
            <div class="${ style.value }" name="value"></div>
        </div>`;

    widgets() {
        return {
            name:{
                view: Label,
                options:{
                    visible: !!this._options.name,
                    text: text(this._options.name)
                }
            },
            value:this._options.value
        }
    }

    widgetsContext( context ){
        return context
    }

}
View.extend();