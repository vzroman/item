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

import {View as Collection} from "../collection";
import {Header} from "./grid/header";
import {Footer} from "./grid/footer";
import {Row} from "./grid/row";
import {Html} from "../primitives/html";
import {Checkbox} from "../controls/checkbox";
import {Pager} from "../widgets/pager";
import {Selection} from "../../utilities/selection";
import {types} from "../../types";
import style from "./grid.css";
import {ContextMenu} from "../widgets/contextmenu/contextMenu"
import {waiting} from "../../utilities/waiting.js";

export class Grid extends Collection{

    static events = {
        onSelect: true,
        rowDblClick: true
    }

    static options = {
        columns:{type:types.primitives.Array, required:true},    // string | { fields, handler } | Item }
        header:{type:types.primitives.Array},                    // string | Item | function -> string | $markup
        footer:{type:types.primitives.Array},
        resizable:{type:types.primitives.Bool},
        numerated:{type:types.primitives.Bool},
        checkbox:{type:types.primitives.Bool},
        multiselect:{type:types.primitives.Bool, default:false},
        pager:{type:types.primitives.Set},
        row:{type: types.primitives.Set },
        context_menu:{type: types.primitives.Set}
    };

    constructor( options ) {
        options.columns = options.columns.map( Grid.compileColumn );

        if (options.checkbox){
            options.columns.unshift({ view:Checkbox, options:{
                css:{pointer_events:"none"},
                links:{ value:"parent@selected" }
            }})
        }

        if (options.numerated){
            options.columns.unshift({ view:Html, options:{ links:{ html: "parent@index" } } })
        }


        super( options );

        if (this._options.resizable) {
            this.#initResize();
        }

        let timer = undefined, selectedRow;
        this.$tbody.bind("item-grid-row-select",(e, row, value)=>{
            if (!this._options.multiselect) { 
                if (value){
                    selectedRow = row
                }else if(row === selectedRow){
                    selectedRow = undefined
                }
                
            };
            if (!timer) timer = setTimeout(()=>{
                timer = undefined;
                if (!this._options) return;
                let selected = this.getSelected();
                if (!this._options.multiselect){
                    for (const r of selected){
                        if (r !== selectedRow) r.set({selected:false});
                    }
                    selected = selectedRow ? [selectedRow] : [];
                }

                this._selection.selected( $( selected.map( r => r.$markup[0] )) );
                this._trigger("onSelect",[selected]);
            });
        });

        this.bind("dblClick", e=>{
            const $row = $(e.target).closest( 'tr' );
            if (!$row) return;
            const item = this.constructor.getItem( $row );
            this._trigger("rowDblClick", [item]);
        })            

            //Context menu event
        if(this._options.context_menu){
            this.$markup.on("contextmenu", (e) =>{
                e.preventDefault();
                const {css, context_data} = this._options.context_menu;
                const coord = this.getContextMenuPosition(e,css);

                // const $row = $(e.target).closest( 'tr' );
                // if (!$row) return;
                // const row = this.constructor.getItem( $row );
                // if (!row) return;

                // let items =undefined, isIncludedInSelection
                // const selected = this.getSelected();
                // if(selected.includes(row)){
                //     isIncludedInSelection = true
                // }else{
                //     for(const r of selected){
                //         if(row !== r) r.set({selected: false})
                //     }
                //     row.set({selected: true});
                //     isIncludedInSelection = false;
                // }
                
                // items = isIncludedInSelection ? selected : [row];

                this._contextmenu = new ContextMenu({
                    $container: this._options.$container,
                    // items,
                    context_data,
                    css: {
                        ...css,
                        ...coord,
                        "position":"absolute",
                        "border":"none",
                        "border-radius":"5px",
                        "box-shadow": "4px 4px 12px rgba(0, 0, 0, 0.25)",
                        "background":"#FFFFFF"
                }})
            });
        }

        this._selection = new Selection({
            $container: this.$tbody,
            $selector: 'tr',
            multiselect: this._options.multiselect,
            onSelect: ({add:addItems=[], remove:removeItems=[]}) =>{
                addItems.forEach( $item => {
                    const row = this.constructor.getItem( $item );
                    if (!row) return;
                    row.set({selected:true});
                });
                removeItems.forEach( $item => {
                    const row = this.constructor.getItem( $item );
                    if (!row) return;
                    row.set({selected:false});
                });
            }
        });
    }

    getContext(){
        return this._options.data;
    }

    getSelected(){
        const selected = [];
        this.$tbody.children(`tr.${ style.selected_row }`).each(function (){
            const row = Row.getItem( $(this) );
            if (row) selected.push( row );
        });
        return selected;
    }

    getRows(){
        const rows = [];
        this.$tbody.children(`tr`).each(function (){
            const row = Row.getItem( $(this) );
            if (row) rows.push( row );
        });
        return rows;
    }

    getContextMenuPosition(e,css){
        const {x, y} = this.getClientPosition(e)

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const menuWidth = parseInt(css["width"], 10);
        const menuHeight = parseInt(css["height"], 10);

        let top,
            left,
            right,
            bottom
        
        if(x + menuWidth > windowWidth){
            right = (windowWidth - x) + "px";
            left = "auto"
        }else {
            left = x + "px";
            right = "auto";
        }

        if(y + menuHeight > windowHeight){
            bottom = (windowHeight - y) + "px";
            top = "auto"
        }else{
            top = y + "px";
            bottom = " auto";
        }
        return {
            "left": `${left}`,
            "top": `${top}`,
            "right": `${right}`,
            "bottom": `${bottom}`
        }
    }
    refresh(){
        this._options.data?.refresh();
        for (const [item] of Object.values( this._items )){
            item.refresh();
        }
    }


    static compileColumn( col ){
        if (typeof col === "string"){
            return { view:Html, options:{
                    links:{ html: {source:"data", event:col} }
                }}
        }else if(typeof col === "object" && col.handler ){
            const {handler, fields=[]} = col;
            return { view:Html, options: {
                    links:{ html:{source:"data", event:fields, handler}}
                }}
        }else{
            return col
        }
    }

    widgets(){
        const widgets = { };

        if (this._options.header){
            widgets.header = {view: Header, options:{
                columns:this.get("header"),
                numerated: this._options.numerated,
                checkbox: this._options.checkbox
            }};
        }

        if (this._options.footer){
            widgets.footer = {view: Footer, options:{
                columns:this.get("footer"),
                numerated: this._options.numerated,
                checkbox: this._options.checkbox
            }};
        }
        if (this._options.pager) {
            widgets.pager = {view: Pager, options: this.get("pager")};
        }

        return widgets;
    }

    markup(){

        const $markup = $(`<div class="${ style.grid } item_grid_container">
            <table class="${ style.table } item_grid_table">
                <thead name="header"></thead>
                <tbody name="tbody"></tbody>
                <tfoot name="footer"></tfoot>
            </table>
            <div name="pager" class="item_grid_pager"></div>
        </div>`);

        this.$table = $markup.find('table');
        this.$thead = $markup.find('thead');
        this.$tbody = $markup.find('tbody');
        this.$tfoot = $markup.find('tfoot');
        return $markup;
    };

    newItem( id, previousRow ){
        return new Row({...this._options.row,...{
            id:id,
            $container: this.$tbody,
            columns: this._options.columns,
            numerated:this._options.numerated,
            parentRow:undefined,
            previousRow:previousRow
        }});
    }

    _placeItem( row, previousRow ){
        row.set({previousRow});
    }

    #initResize() {

        const $tr = $(`<tr></tr>`).prependTo(this.$thead);

        const columns = this._options.columns.map(()=>{
            const $column = $(`<th class="${style.resizer_header}"></th>`).appendTo($tr);
            const $resizer = $(`<span class="${style.resizer}"></span>`).appendTo($column);
            return {
                $column,
                $resizer
            }
        });


        this.heightObserver = new ResizeObserver(([entry]) => {
            columns.forEach(({$resizer})=>{
                $resizer.css({"height": entry.contentRect.height+"px"});
            });
        });

        this.heightObserver.observe(this.$table[0]);

        columns.forEach(({$column, $resizer})=>{

            let pos = 0;
            const onDrag = e => {
                if (e.buttons !== 1) {
                    window.removeEventListener('mousemove', onDrag);
                    return;
                }
                const delta = e.clientX - pos;
                pos = e.clientX;

                let cell_width = $column.outerWidth() + delta;
                let table_width = this.$table.outerWidth() + delta;

                $column.css({"width": cell_width + "px"});
                this.$table.css({"width": table_width + "px"});
            }
            $resizer.on("mousedown", e => {
                pos = e.clientX;
                window.addEventListener('mousemove', onDrag);
                window.addEventListener('mouseup', ()=>{
                    window.removeEventListener('mousemove', onDrag);
                });
            });

        });
    }

    _destroy() {
        this.heightObserver?.disconnect();
        this._contextmenu?.destroy();
        this._selection?.destroy();
        super._destroy();
    }
}
Grid.extend();



