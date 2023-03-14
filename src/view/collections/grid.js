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

import {View as Collection} from "../collection.js";
import {View as Item} from "../item.js";
import {types} from "../../types/index.js";
import {controls} from '../controls';
import style from "./grid.css";

class Header extends Item{

    static options = {
        columns:{type:types.primitives.Array, required:true},
        numerated:{type:types.primitives.Bool},
        selectable:{type:types.primitives.Bool}
    };
    
    constructor( options ) {
        const { numerated, selectable } = options;

        options.columns = options.columns.map( col =>{
            if (typeof col === "object" && col.view!==undefined) {
                return col
            }
            if (typeof col === "string" || typeof col==="number" || typeof col === "function"){
                col = { text: col};
            }else if(typeof col!=="object"){
                throw new Error("invalid column format");
            }

            const {text,...rest} = col;
            if (typeof text === "string" || typeof text==="number") {
                return { view:Cell, options:{ text }, ...rest}
            } else if (typeof text === "function") {
                return { view:Cell, options: {
                    links:{ text:{source:"data", event:[], handler: text}}
                }, ...rest}
            }else{
                throw new Error("invalid column format");
            }
        });

        if (numerated) options.columns = [
            { view:Cell, options: { style: {"width": "32px"} } },
            ...options.columns
        ];
        if (selectable) options.columns = [
            { view:Cell, options: { style: {"width": "32px"} } },
            ...options.columns
        ];

        super( options );
    }

    markup() {
        const $markup = $(`<tr></tr>`);
        this._options.columns.forEach(({colspan=1}, i)=> $(`<td colspan="${colspan}" name=${ i }></td>`).appendTo($markup));
        return $markup;
    }

    widgets(){
        return this._options.columns.reduce((acc, col, i)=>{
            acc[i] = col;
            return acc;
        },{});
    }
}
Header.extend();

class Footer extends Header{

}
Footer.extend();

class Pages extends Item{

    static options = {
        page:{type:types.primitives.Integer, default: 1},
        totalCount:{type:types.primitives.Integer},
        pageSize:{type:types.primitives.Integer},
        maxVisible:{type:types.primitives.Integer, default: 10}
    };

    constructor( options ) {
        super( options );

        this.bind("pageSize", () => {
            this.set({page: 1});
            this.updatePages()
        });
        this.bind("totalCount", () => {
            this.updatePages()
        });
        this.bind("page", () => {
            this.updatePages();
        });
    }

    markup() {
        const $markup = $(`
            <div class="${style.pagination}">
                <div data-page="1" class="${style.chevronLast}"></div>
                <div data-chevron="prev" class="${style.chevron}"></div>

                <div name="prev">...</div>
                <div class="${style.pages}" name="pages"></div>
                <div name="next">...</div>

                <div data-chevron="next" class="${style.chevron}" style="transform: rotate(180deg)"></div>
                <div name="last" class="${style.chevronLast}" style="transform: rotate(180deg)"></div>
            </div>
        `);
        this.$pages = $markup.find('[name="pages"]');
        this.$next = $markup.find('[name="next"]');
        this.$prev = $markup.find('[name="prev"]');
        this.$last = $markup.find('[name="last"]');

        $markup.on( "click", event => this.onClick(event) );
        return $markup;
    }

    onClick(event) {
        const cur_page = this.get("page");
        const totalPages = Math.ceil(this.get("totalCount") / this.get("pageSize"));

        const clickedPage = $(event.target).attr("data-page");
        const clickedChev = $(event.target).attr("data-chevron");
        
        
        if (clickedChev !== undefined) {
            if (clickedChev === "next" && cur_page !== totalPages) {
                this.set({page: cur_page+1});
            } else if (clickedChev === "prev" && cur_page !== 1) {
                this.set({page: cur_page-1});
            }
        }

        if (clickedPage !== undefined) {
            this.set({page: Number(clickedPage)});
        }
    }

    updatePages() {
        this.$pages.empty();
        const maxVisible = this.get("maxVisible");

        const { page, totalCount, pageSize } = this._options;
        const totalPages = Math.ceil(totalCount / pageSize)
        const startIndex = (Math.ceil(page / maxVisible) - 1) * maxVisible + 1;
        const endIndex = Math.min(startIndex + maxVisible - 1, totalPages);

        this.$prev.attr("data-page", startIndex-1);
        this.$next.attr("data-page", endIndex+1);

        this.$last.attr("data-page", totalPages);

        this.$prev.toggle(Math.ceil(page / maxVisible) !== 1);
        this.$next.toggle(Math.ceil(page / maxVisible) !== Math.ceil(totalPages / maxVisible));
    
        for (let i = startIndex; i <= endIndex; i++) {
            const $pageCell = $(`<div data-page="${i}">${i}</div>`);
            if (i === page) {
                $pageCell.addClass(style.activePage);
            }
            this.$pages.append($pageCell);
        }
    }
}
Pages.extend();

class Pager extends Item{

    static options = {
        page:{type:types.primitives.Integer, default: 1},
        totalCount:{type:types.primitives.Integer},
        pageSize:{type:types.primitives.Integer},
        pageSizeValues:{type:types.primitives.Array, default: [30, 100, 300]},
        maxVisible:{type:types.primitives.Integer, default: 10}
    }
    constructor( options ) {
        super( options );
        ["pageSize", "totalCount", "page"].forEach(e => {
            this.bind(e, () => this.updateTotalItemsText());
        });
    }
    markup() {
        const $markup = $(`
            <div style="display: flex;justify-content: space-between;align-items: center;width: 100%;">
                <div class="${style.pager}">
                    <div name="pagination"></div>
                    <div name="pageSize"></div>
                </div>
                <div name="totalItems"></div>
            </div>
        `)
        this.$totalItems = $markup.find(`[name="totalItems"]`);
        return $markup;
    }

    widgets(){
        const widgets = {
            pagination: {
                view: Pages,
                options: {
                    maxVisible: this.get("maxVisible"),
                    links: {
                        page:"parent@page",
                        totalCount: "parent@totalCount",
                        pageSize:"parent@pageSize"
                    },
                    events:{ page:"parent@page" }
                }
            },
            pageSize: {view: controls.Dropdown, options: {
                items:  this.get("pageSizeValues").map(num => ({id:num})),
                itemValue:"id",
                links: { value: "parent@pageSize" },
                events: { value: "parent@pageSize" }
            }}
        };
        return widgets;
    }

    updateTotalItemsText() {
        const { page, totalCount, pageSize=totalCount } = this._options;
        const firstItemIndex = (page - 1) * pageSize + 1;
        const lastItemIndex = Math.min(page * pageSize, totalCount);
        this.$totalItems.text( `${firstItemIndex} - ${lastItemIndex} out of ${totalCount}` );
    }
}
Pager.extend();

export class View extends Collection{

    static events = {
        onSelect: true
    }

    static options = {
        columns:{type:types.primitives.Array, required:true},    // string | { fields, handler } | Item }
        header:{type:types.primitives.Array},                    // string | Item | function -> string | $markup
        footer:{type:types.primitives.Array},
        resizable:{type:types.primitives.Bool},
        numerated:{type:types.primitives.Bool},
        selectable:{type:types.primitives.Bool},
        pager:{type:types.primitives.Set}
    };

    constructor( options ) {
        options.columns = options.columns.map( col =>{
            if (typeof col === "string"){
                return { view:Cell, options:{
                    links:{ text: {source:"data", event:col} }
                }}
            }else if(typeof col === "object" && col.handler ){
                const {handler, fields=[]} = col;
                return { view:Cell, options: {
                    links:{ text:{source:"data", event:fields, handler}}
                }}
            }else{
                return col
            }
        });
        super( options );

        if (this._options.numerated) {
            const state ={
                page:undefined,
                pageSize:undefined
            };
            ["page", "pageSize", "totalCount"].forEach(e=>{
                this._options.data.bind("$."+e,value=>{
                    state[e]=value ?? 1;
                    const startIndex = (state["page"] - 1) * state["pageSize"] + 1;
                    // setTimeout because items not in view yet;
                    setTimeout(()=>this.updateIndexies(startIndex));
                })
            })
        }
        if (this._options.resizable) {
            this.init_column_resize();
        }
        if (this._options.selectable) {
            this.init_select();
        }
    }

    updateIndexies(startIndex=1) {
        Object.keys( this._items ).forEach(id => {
            this._items[id][0].set({index: startIndex++});
        })
    }

    init_select() {
        this.selected = [];
        this.temp = [];
        this.from = null;
        this.timer = null;

        this.$tbody.on("click", e => {

            clearTimeout(this.timer);
            let tr = e.target.closest('tr');
            if (!tr || !this.$tbody[0].contains(tr)) return;

            this.select($(tr).data("row_id"), e);
            this.styleSelecterRows();
        })
        this.lassoSelect();
    }
    
    lassoSelect() {
        let startX = 0,
            startY = 0,
            drawing = false;

        const onDraw = e => {
            if (e.buttons !== 1) return destroy();
            drawing = true;
            styleLasso(e);
        }

        this.$wrapper.on("mousedown", e => {
            this.timer = setTimeout(() => {
                if ($(e.target).hasClass(style.resizer)) return;
    
                const _from = this.getRowIndex($(e.target.closest('tr')).data("row_id"));
                if (_from === -1) return;
                this.from = _from;

                if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                    this.selected = [];
                    this.styleSelecterRows();
                }

                startX = e.pageX - this.$wrapper.offset().left;
                startY = e.pageY - this.$wrapper.offset().top;
                drawing = false;
                this.$tfoot.css({"pointer-events": "none"});
                window.addEventListener('mousemove', onDraw);
                window.addEventListener('mouseup', destroy);
            }, 150);
        });

        const destroy = e => {
            if (drawing) beforeDestroy(e);

            drawing = false;
            this.$lasso.css({"display": "none"});
            this.$tfoot.css({"pointer-events": "unset"});
            window.removeEventListener('mousemove', onDraw);
        }

        const beforeDestroy = e => {
            const to = this.getRowIndex($(e.target.closest('tr')).data("row_id"));
            const rows = this.getTableRows(this.from, to);

            this.temp = rows.filter(el => !this.selected.includes(el));

            if (e.ctrlKey || e.metaKey) {
                rows.forEach(el => {
                    if (!this.selected.includes(el)) {
                        this.selected.push(el);
                    } else {
                        this.selected.splice(this.selected.indexOf(el), 1);
                    }
                })
            } else {
                this.selected = [...new Set([...this.selected, ...rows])];
            }
            
            this.styleSelecterRows();
        }

        const styleLasso = e => {
            const currentX = e.pageX - this.$wrapper.offset().left;
            const currentY = e.pageY - this.$wrapper.offset().top;
            const width = currentX - startX;
            const height = currentY - startY;

            this.$lasso.css({
                "display": "unset",
                "width": Math.abs(width)+ "px",
                "height": Math.abs(height)+ "px",
                "left": ((width < 0 ? currentX : startX) + this.$wrapper.scrollLeft()) + "px",
                "top": ((height < 0 ? currentY : startY) + this.$wrapper.scrollTop()) + "px"
            })
        }
    }
 
    select(id, e) {
        if (e.shiftKey && !(e.ctrlKey || e.metaKey)) {
            if (this.selected.length === 0) {
                this.selected = [id];
                this.temp = [];
                this.from = this.getRowIndex(id);
            } else {
                const to = this.getRowIndex(id);
                const rows = this.getTableRows(this.from, to);

                this.selected = this.selected.filter(el => !this.temp.includes(el));

                this.temp = rows.filter(el => !this.selected.includes(el));
                this.selected = [...new Set([...this.selected, ...rows])];
            }
        } else {
            this.selected = (e.ctrlKey || e.metaKey) ? toggleArrayElement(this.selected, id) : 
                (this.selected.length === 1 && this.selected[0] === id) ? [] : [id];
    
            this.from = this.getRowIndex(id);
            this.temp = [];
        }     
    }

    getTableRows(from, to) {
        let _from = Math.min(from, to), _to = Math.max(from, to);
        return this.$tbody.find(`tr[data-row_id]`).slice(_from, _to+1).toArray().map(row => $(row).data("row_id"));
    }

    getRowIndex(id) {
        const row = this.$tbody.find(`tr[data-row_id='${id}']`);
        return this.$tbody.find(`tr[data-row_id]`).index(row);
    }

    styleSelecterRows() {
        Object.keys(this._items).forEach(id =>{
            if (this.selected.includes(id)) {
                this._items[id][0].set({selected: true});
            } else {
                this._items[id][0].set({selected: false});
            }
        })
        this._trigger("onSelect", [this.selected]);
    }

    widgets(){
        const widgets = { };

        if (this._options.header){
            widgets.header = {view: Header, options:{ columns:this.get("header"), numerated: this._options.numerated, selectable: this._options.selectable }};
        }

        if (this._options.footer){
            widgets.footer = {view: Footer, options:{ columns:this.get("footer"), numerated: this._options.numerated, selectable: this._options.selectable }};
        }
        if (this._options.pager) {
            widgets.pager = {view: Pager, options:{
                ...this.get("pager"),
                links: { page:"data@$.page", totalCount: "data@$.totalCount",pageSize:"data@$.pageSize" },
                events: { page:"data@$.page", pageSize: "data@$.pageSize" }
            }};
        }

        return widgets;
    }

    markup(){
        const $markup = $(`<div class="${ style.grid } item_grid_container">
            <div class="${ style.wrapper } item_grid_table_container">
                <div class="${style.lasso} item_grid_lasso"></div>
                <table class="${ style.table } item_grid_table">
                    <thead name="header"></thead>
                    <tbody></tbody>
                    <tfoot name="footer"></tfoot>
                </table>
            </div>
            <div name="pager" class="${ style.pager_wrapper } item_grid_pager"></div>
        </div>`);
        this.$tbody = $markup.find('tbody');
        this.$tfoot = $markup.find('tfoot');
        this.$lasso = $markup.find(".item_grid_lasso");
        this.$wrapper = $markup.find(".item_grid_table_container");
        return $markup;
    };

    newItem( id ){
        return new Row({
            id:id,
            $container:this.$tbody,
            columns:this._options.columns,
            selectable:this._options.selectable,
            numerated:this._options.numerated,
        });
    }

    init_column_resize() {
        const $thead = $(this.$markup.find("thead[name='header']")[0]);

        const $tr_markup = $(`<tr></tr>`);
        this._options.numerated;
        this._options.selectable;

        const numColumns = this._options.columns.length;
        const hasNumerated = this._options.numerated ? 1 : 0;
        const hasSelectable = this._options.selectable ? 1 : 0;
        const count = numColumns + hasNumerated + hasSelectable;

        for (let i = 0; i < count; i++) {
            $(`<th class="${style.resizer_header}"><span class="${style.resizer}"></span></th>`).appendTo($tr_markup);
        }

        $tr_markup.prependTo($thead);

        const $table = $thead.parent();
        const $columns = $tr_markup.children();

        this.height_observer = new ResizeObserver(([entry]) => {
            $columns.find("span").css({"height": entry.contentRect.height+"px"});
        });

        this.height_observer.observe($table[0]);

        $columns.each((_, $cell) => {
            $cell = $($cell);
    
            let pos = 0;
            const onDrag = e => {
                if (e.buttons !== 1) {
                    window.removeEventListener('mousemove', onDrag);
                    return;
                }
                const delta = e.clientX - pos;
                pos = e.clientX;
                
                let cell_width = $cell.outerWidth() + delta;
                let table_width = $table.outerWidth() + delta;
    
                $cell.css({"width": cell_width + "px"});
                $table.css({"width": table_width + "px"});
            }
            $cell.children(`.${style.resizer}`).on("mousedown", e => {
                pos = e.clientX;
                window.addEventListener('mousemove', onDrag);
                window.addEventListener('mouseup', ()=>{
                    window.removeEventListener('mousemove', onDrag);
                });
            })
        })
    }

    destroy() {
        this.height_observer?.disconnect();
        super.destroy();
    }
}
View.extend();



class Row extends Item{

    static options = {
        columns:{type:types.primitives.Array, required:true},
        selected:{type:types.primitives.Bool},
        selectable:{type:types.primitives.Bool},
        numerated:{type:types.primitives.Bool},
        index:{type:types.primitives.Integer, default: 1}
    };

    constructor( options ) {
        super( options );
        this.bind("selected", (val=false) => {
            this.$checkbox.prop('checked', val);
            this.$markup.toggleClass(style.selected_row, val);
        })

        this.bind("index", val=>this.$index.text(val));
    }

    markup() {
        const { id, numerated, selectable, columns } = this._options;
        const $markup = $(`<tr data-row_id="${id}"></tr>`);
        if (numerated) {
            $(`<td name="index"></td>`).appendTo($markup);
        }
        if (selectable) {
            $(`<td><input name="checkbox" type="checkbox"></input></td>`).appendTo($markup);
        }
        this.$index =$markup.find(`[name="index"]`);
        this.$checkbox = $markup.find(`[name="checkbox"]`);
        columns.forEach((_,i)=> $(`<td name="${ i }"></td>`).appendTo($markup) );
        return $markup;
    }

    widgets(){
        return this._options.columns.reduce((acc, col, i)=>{
            acc[i] = col;
            return acc;
        },{});
    }
}
Row.extend();

class Cell extends Item{
    static options = {
        text:{type:types.primitives.Any}
    };
    constructor(options) {
        super(options);
        if (options.style) {
            this._options.$container.css(options.style);
        }
        this.bind("text", val=>this._options.$container.html( val ))
    }
}
Cell.extend();

function toggleArrayElement(array, element) {
    return array.includes(element)
        ? array.filter(_id => _id !== element)
        : [...array, element];
}
