//-----------------------------------------------------------------
// Copyright (c) 2022, Faceplate LTD. All Rights Reserved.
// Author: Vozzhenikov Roman, vzroman@gmail.com
//-----------------------------------------------------------------
import {types} from "../../types/index.js";
import {View as Parent} from "../../view/item.js";
import {Label} from "../primitives/label.js";
import {text} from "../../i18n/i18n.js";
import style from "./formField.css";


export class FormField extends Parent{

    static options = {
        name:{type: types.primitives.String },
        value:{type: types.complex.Item, options:{schema:{
            view:{type:types.primitives.Class, options:{ class:Parent } },
            options:{type: types.primitives.Set }
        }}, required:true },
        vertical:{type: types.primitives.Bool, default:true }
    };

    markup(){
        return `<div class="${ style.field } ${ this._options.vertical?style.vertical:style.horizontal  }">
            <div class="${ style.name }" name="name"></div>
            <div class="${ style.value }" name="value"></div>
        </div>`;
    }

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

    linkWidgets( sources ){
        Object.values(this._widgets).forEach(widget => widget.link( sources ));
    }


    value( value ){
        if (typeof this._widgets.value.value === "function" ){
            return this._widgets.value.value( value );
        }else{
            return undefined;
        }
    }

}
FormField.extend();