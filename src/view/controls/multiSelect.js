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

import {Control} from "./control.js";
import {types} from "../../types/index.js";
import {View as Flex} from "../collections/flex.js";
import {View as ItemView} from "../item.js";
import { controllers } from "../../controllers";
import { controls } from "./index.js";
import { Label } from "../primitives/label.js";
import {Control as Parent} from "./dropdown.js";

import dropdown from "../../img/dropdown.svg";
import close from "../../img/close.svg";

import styles from "./multiSelect.css";

export class MultiSelect extends Control{
    static markup = `<div class="${ styles.multiselect }">
        <div class="${styles.selected_items}">
            <div name="selected"></div>
            <div name="items"></div>
        </div>
        <div name="toggle"></div>
    </div>`;

    static options = {
        value:{type: types.primitives.Array, default:[]},
        size:{type: types.primitives.Integer},
        items:{type: types.primitives.Any},
        itemValue:{type: types.primitives.String},
        itemText:{type: types.primitives.Any},
        itemGroup:{type: types.primitives.Any},
        isExpanded:{type: types.primitives.Bool, default: false},
        isDropdownVisible:{type: types.primitives.Bool, default: false}
    }

    constructor( options ){
        super( options );

        const _items = new Map();

        const _id = this._options.itemValue || "value";
        const _text = this._options.itemText || _id;

        const selectedController = new controllers.Collection({
            id:"id",
            schema:{
                id:{type: types.primitives.Any} ,
                text:{type: types.primitives.String}
            },
            data: []
        });

        const updateSelectedController=()=>{
            
            selectedController.set( Object.fromEntries( [..._items.keys()].map(id => [id, null]) ) );
            
            const value = this.get("value") || [];
            for (const v of value){
                selectedController.set({[v]:{id:v, text:_items.get(v)}} );
            }
        }

        const updateItems = (items)=>{
            if (typeof items[0] !== "object"){
                // The data is a simple list of values, transform it to the list of items
                items = items.map( value => { return {value} });
            }
            _items.clear();
            for (const item of items){
                _items.set( item[_id], item[_text] )
            }

            const value = this.get("value").filter(v => _items.has(v));
            this.set({value});
            updateSelectedController();
        }

        this.bind("value", updateSelectedController);

        this.bind("items", items=>{
            if (items instanceof controllers.Collection){
                items.onReady().then(()=> updateItems( Object.values( items.get() ) ) )
            }else{
                updateItems( items )
            }
        });

        const $selectedWrapper = this.$markup.find('[name="selected"]');
        this.$itemsContainer = this.$markup.find('[name="items"]');

        $selectedWrapper.on("click", (e) => {
            // todo. there might be more consistent way of knowing if element is close btn
            const isDeleteBtn = e.target.parentNode.className.endsWith("item_button");
            if (isDeleteBtn) return;
            const isExpanded = !this.get("isExpanded");
            this.set({isExpanded});
        });

        this._closeDropdown = (e) => {
            if (!this.get("isExpanded")) {
                return;
            }

            const dropdown = this._widgets?.items?.$markup?.[0];
            if (!this.$markup[0].contains(e.target) && !dropdown?.contains(e.target)) {
                this.set({isExpanded: false});
            }
        };

        this._closeOnViewportChange = (e) => {
            const dropdown = this._widgets?.items?.$markup?.[0];
            if (e?.type === "scroll" && dropdown?.contains(e.target)) {
                return;
            }

            if (this.get("isExpanded")) {
                this.set({isExpanded: false});
            }
        };

        this._scheduleDropdownPosition = () => {
            if (!this.get("isExpanded") || this._positionFrame) return;

            this._positionFrame = window.requestAnimationFrame(() => {
                this._positionFrame = undefined;
                if (this.get("isExpanded")) {
                    this._positionDropdown();
                }
            });
        };

        window.addEventListener("click", this._closeDropdown);
        window.addEventListener("resize", this._scheduleDropdownPosition);
        window.addEventListener("mousemove", this._scheduleDropdownPosition);
        window.addEventListener("pointermove", this._scheduleDropdownPosition);
        window.addEventListener("scroll", this._closeOnViewportChange, true);

        this.bind("isExpanded", isExpanded => {
            if (isExpanded) {
                this._showDropdown();
            } else {
                this._hideDropdown();
            }
        });

        this._widgets.selected.link({data:selectedController});
    }

    _showDropdown() {
        const dropdown = this._widgets?.items;
        if (!dropdown?.$markup?.length) return;

        this.set({isDropdownVisible: false});

        dropdown.$markup
            .appendTo($("body"))
            .addClass(styles.portalDropdown);

        this._positionDropdown();
        this.set({isDropdownVisible: true});
    }

    _hideDropdown() {
        const dropdown = this._widgets?.items;
        if (!dropdown?.$markup?.length || !this.$itemsContainer?.length) return;

        this.set({isDropdownVisible: false});

        dropdown.$markup
            .removeClass(styles.portalDropdown)
            .css({left: "", top: "", width: ""})
            .appendTo(this.$itemsContainer);
    }

    _positionDropdown() {
        const dropdown = this._widgets?.items;
        if (!dropdown?.$markup?.length || !this.$markup?.length) return;

        const rect = this.$markup[0].getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const gap = 0;

        dropdown.$markup.css({
            width: `${rect.width}px`,
            left: `${rect.left}px`,
            top: `${rect.bottom + gap}px`
        });

        const dropdownHeight = dropdown.$markup.outerHeight();
        const spaceBelow = viewportHeight - rect.bottom - gap;
        const spaceAbove = rect.top - gap;

        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            dropdown.$markup.css({top: `${Math.max(gap, rect.top - dropdownHeight - gap)}px`});
        }
    }

    widgets() {
        return {
            selected:{
                view:Flex,
                options:{
                    data: undefined,
                    direction:"horizontal",
                    flexWrap: "wrap",
                    item:{
                        view:SelectButton,
                        options:{
                            links:{ text:"data@text" },
                            events:{
                                onDelete:{
                                    handler: (id)=>{
                                        this.set({value: this._options.value.filter(val => val !== id)});
                                    }
                                }
                            }
                        }
                    }
                }
            },
            toggle:{
                view: controls.Button,
                options:{
                    icon:`url("${ dropdown }")`,
                    events:{
                        click:{ handler:() => {
                            const isExpanded = !this.get("isExpanded");
                            this.set({ isExpanded });
                        }}
                    },
                    links: {
                        classes: { source: "parent@isExpanded", handler: isExpanded => {
                            return isExpanded ? [styles.arrow] : [];
                        } }
                    }
                }
            },
            items: {
                view: Dropdown,
                options: {
                    value:this._options.value,
                    items:this._options.items,
                    itemValue:this._options.itemValue,
                    itemText:this._options.itemText,
                    links:{
                        value:"parent@value",
                        items:"parent@items",
                        itemValue:"parent@itemValue",
                        itemText:"parent@itemText",
                        classes: { source: "parent@isDropdownVisible", handler: isDropdownVisible => {
                            return isDropdownVisible ? [styles.show] : [];
                        } }
                    },
                    events:{
                        value:"parent@value",
                    }
                }
            }
        }
    }

    _destroy() {
        window.removeEventListener("click", this._closeDropdown);
        window.removeEventListener("resize", this._scheduleDropdownPosition);
        window.removeEventListener("mousemove", this._scheduleDropdownPosition);
        window.removeEventListener("pointermove", this._scheduleDropdownPosition);
        window.removeEventListener("scroll", this._closeOnViewportChange, true);
        if (this._positionFrame) {
            window.cancelAnimationFrame(this._positionFrame);
            this._positionFrame = undefined;
        }
        this._hideDropdown();
        this.$itemsContainer = undefined;
        super._destroy();
    }
}
MultiSelect.extend();

class SelectButton extends ItemView{

    static events = {
        onDelete: true
    }

    static options = {
        text:{type: types.primitives.String}
    }

    static markup = `<div class="${styles.selectButton}">
        <div name="text"></div>
        <div name="close"></div>
    </div>`;

    widgets() {
        return {
            text:{
                view: Label,
                options:{
                    links:{text:"parent@text" }
                }
            },
            close:{
                view: controls.Button,
                options:{
                    icon:`url("${ close }")`,
                    events:{ click:{ handler:()=>{
                        this._trigger("onDelete", [this._options.data.get("id")]);
                    }}}
                }
            }
        }
    }
}
SelectButton.extend();

class Dropdown extends Parent {
    static markup = `<div class="${styles.dropdown}"></div>`;

    static options = {
        value:{type: types.primitives.Array},
        multiselect:{type: types.primitives.Bool, default:true}
    };

    constructor( options ){
        super( options );

        this.$markup.on("click", (event) => {
            if (!this._options.multiselect && event.target?.checked){
                this.$markup.find('input:checked').each(function() {
                    if (this === event.target) return;
                    $(this).attr("checked", false);
                });
            }

            if (this._options.multiselect && !event.target.hasOwnProperty("checked")) {
                const $input = $(event.target).find('input');
                $input.prop("checked", !$input.prop("checked"));
            }

            this.setValue( this._getValues() );
        });

        this.$markup.off("change");
    }

    updateValue( value, prev ){
        value = Array.isArray(value) ? value : [];

        this.$markup.find('input').each(function() {
            const isChecked = value.includes($(this).data("value"));
            $(this).attr("checked", isChecked);
        })
    }

    _updateItems() {
        this.$markup.empty();

        const itemValue = this._options.itemValue || "value";
        const itemText = this._options.itemText || itemValue;
        const itemValueFun = typeof itemValue === "function" ? itemValue : item => item[itemValue];
        const itemTextFun = typeof itemText === "function" ? itemText : item => item[itemText];

        const currentValue = this.getValue() || [];

        this._itemsController.view().forEach(([id, item]) => {
            const value = itemValueFun( item );
            const text = itemTextFun( item );
            const checked = currentValue.includes(value) ? "checked" : "";

            const $elem = $(`<a>
                <input type="checkbox" ${checked}/>
                ${ text }
            </a>`);

            $elem.children('input').data("value", value);

            $elem.appendTo( this.$markup );
        });

        this.setValue( this._getValues() );
    }

    _getValues() {
        const _values = [];
        this.$markup.find('input:checked').each(function() {
            _values.push($(this).data("value"));
        });
        return _values;
    }
}
Dropdown.extend();
