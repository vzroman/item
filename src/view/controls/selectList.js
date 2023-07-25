//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2023 vzroman
// Author: Vozzhenikov Roman, vzroman@gmail.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//------------------------------------------------------------------------------------

import {Control as Dropdown} from "./dropdown";
import {types} from "../../types/index.js";

export class SelectList extends Dropdown{
    static markup = `<div style="height:100%; width:100%;"></div>`;

    static options = {
        value:{type: types.primitives.Array},
    }

    constructor( options ){
        super( options );

        this.$markup.on("click", () => {
            this.setValue( this._getValues() );
        })

        this.$markup.off("change");
    }

    updateValue( value, prev ){
        value = Array.isArray(value) ? value : [];
        this.$markup.find('input').each(function() {
            const isChecked = value.includes($(this).data("value"));
            $(this).attr("checked", isChecked);
        })
    }

    _updateItems(){
        this.$markup.empty();

        const itemValue = this._options.itemValue || "value";
        const itemText = this._options.itemText || itemValue;
        const itemValueFun = typeof itemValue === "function" ? itemValue : item => item[itemValue];
        const itemTextFun = typeof itemText === "function" ? itemText : item => item[itemText];

        const currentValue = this.getValue() || [];
        this._itemsController.view().forEach(([id, item])=>{
            const value = itemValueFun( item );
            const text = itemTextFun( item );
            const checked = currentValue.includes(value) ? "checked" : "";

            const $elem = $(`<div>
                <input type="checkbox" ${checked}/>
                ${ text }
            </div>`);
            $elem.children('input').data("value", value);
            $elem.appendTo( this.$markup );
        });
        this.setValue( this._getValues() );

    }

    _getValues() {
        const _values = [];
        this.$markup.find('input:checked').each(function() {
            _values.push($(this).data("value"));
        })
        return _values;
    }
}
SelectList.extend();