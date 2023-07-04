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
import {selection} from "../../utilities/selection";
import {types} from "../../types";
import style from "./grid.css";






// class Pages extends Item{
//
//     static options = {
//         page:{type:types.primitives.Integer, default: 1},
//         totalCount:{type:types.primitives.Integer},
//         pageSize:{type:types.primitives.Integer},
//         maxVisible:{type:types.primitives.Integer, default: 10}
//     };
//
//     constructor( options ) {
//         super( options );
//
//         this.bind("pageSize", () => {
//             this.updatePages()
//         });
//         this.bind("totalCount", () => {
//             this.updatePages()
//         });
//         this.bind("page", () => {
//             this.updatePages();
//         });
//     }
//
//     markup() {
//         const $markup = $(`
//             <div class="${style.pagination}">
//                 <div data-page="1" name="first_page" class="${style.chevronLast}"><div></div></div>
//                 <div data-chevron="prev" class="${style.chevron}"><div></div></div>
//
//                 <div name="prev">...</div>
//                 <div class="${style.pages}" name="pages"></div>
//                 <div name="next">...</div>
//
//                 <div data-chevron="next" class="${style.chevron}" style="transform: rotate(180deg)"><div></div></div>
//                 <div name="last" class="${style.chevronLast}" style="transform: rotate(180deg)"><div></div></div>
//             </div>
//         `);
//         this.$pages = $markup.find('[name="pages"]');
//         this.$next = $markup.find('[name="next"]');
//         this.$prev = $markup.find('[name="prev"]');
//         this.$last = $markup.find('[name="last"]');
//
//         $markup.on( "click", event => this.onClick(event) );
//         return $markup;
//     }
//
//     onClick(event) {
//         const cur_page = this.get("page");
//         const totalPages = Math.ceil(this.get("totalCount") / this.get("pageSize"));
//
//         const clickedPage = $(event.target).attr("data-page");
//         const clickedChev = $(event.target).attr("data-chevron");
//
//         if (clickedChev !== undefined) {
//             if (clickedChev === "next" && cur_page !== totalPages) {
//                 this.set({page: cur_page+1});
//             } else if (clickedChev === "prev" && cur_page !== 1) {
//                 this.set({page: cur_page-1});
//             }
//         }
//
//         if (clickedPage !== undefined) {
//             this.set({page: Number(clickedPage)});
//         }
//     }
//
//     updatePages() {
//         this.$pages.empty();
//         const maxVisible = this.get("maxVisible");
//
//         const { page, totalCount, pageSize } = this._options;
//         const totalPages = Math.ceil(totalCount / pageSize)
//         const startIndex = (Math.ceil(page / maxVisible) - 1) * maxVisible + 1;
//         const endIndex = Math.min(startIndex + maxVisible - 1, totalPages);
//
//         this.$prev.attr("data-page", startIndex-1);
//         this.$next.attr("data-page", endIndex+1);
//
//         this.$last.attr("data-page", totalPages);
//
//         this.$prev.toggle(Math.ceil(page / maxVisible) !== 1);
//         this.$next.toggle(Math.ceil(page / maxVisible) !== Math.ceil(totalPages / maxVisible));
//
//         for (let i = startIndex; i <= endIndex; i++) {
//             const $pageCell = $(`<div data-page="${i}">${i}</div>`);
//             if (i === page) {
//                 $pageCell.addClass(style.activePage);
//             }
//             this.$pages.append($pageCell);
//         }
//
//         const arrow_prev = this.$markup.find('[data-chevron="prev"]');
//         const arrow_next = this.$markup.find('[data-chevron="next"]');
//         const arrow_first = this.$markup.find('[name="first_page"]');
//
//         this.$last.css({"pointer-events": ""});
//         arrow_prev.css({"pointer-events": ""});
//         arrow_next.css({"pointer-events": ""});
//         arrow_first.css({"pointer-events": ""});
//
//         if (page === totalPages) {
//             this.$last.css({"pointer-events": "none"});
//             arrow_next.css({"pointer-events": "none"});
//         }
//         if (page === 1) {
//             arrow_first.css({"pointer-events": "none"});
//             arrow_prev.css({"pointer-events": "none"});
//         }
//     }
// }
// Pages.extend();
//
// export class Pager extends Item{
//
//     static options = {
//         page:{type:types.primitives.Integer, default: 1},
//         totalCount:{type:types.primitives.Integer},
//         pageSize:{type:types.primitives.Integer},
//         pageSizeValues:{type:types.primitives.Array, default: [30, 100, 300]},
//         maxVisible:{type:types.primitives.Integer, default: 10}
//     }
//     constructor( options ) {
//         super( options );
//         ["pageSize", "totalCount", "page"].forEach(e => {
//             this.bind(e, () => this.updateTotalItemsText());
//         });
//     }
//     markup() {
//         const $markup = $(`
//             <div style="display: flex;justify-content: space-between;align-items: center;width: 100%;">
//                 <div class="${style.pager}">
//                     <div name="pagination"></div>
//                     <div name="pageSize"></div>
//                 </div>
//                 <div name="totalItems"></div>
//             </div>
//         `)
//         this.$totalItems = $markup.find(`[name="totalItems"]`);
//         return $markup;
//     }
//
//     widgets(){
//         const widgets = {
//             pagination: {
//                 view: Pages,
//                 options: {
//                     maxVisible: this.get("maxVisible"),
//                     links: {
//                         page:"parent@page",
//                         totalCount: "parent@totalCount",
//                         pageSize:"parent@pageSize"
//                     },
//                     events:{ page:"parent@page" }
//                 }
//             },
//             pageSize: {view: controls.Dropdown, options: {
//                 items:  this.get("pageSizeValues").map(num => ({id:num})),
//                 itemValue:"id",
//                 links: { value: "parent@pageSize" },
//                 events: { value: "parent@pageSize" }
//             }}
//         };
//         return widgets;
//     }
//
//     updateTotalItemsText() {
//         const { page, totalCount, pageSize=totalCount } = this._options;
//         const firstItemIndex = (page - 1) * pageSize + 1;
//         const lastItemIndex = Math.min(page * pageSize, totalCount);
//         this.$totalItems.text( `${firstItemIndex} - ${lastItemIndex} out of ${totalCount}` );
//     }
// }
// Pager.extend();

export class Grid extends Collection{

    static events = {
        onSelect: true
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
        // isFolder:{type:types.primitives.Any},
        // getIcon:{type:types.primitives.Any},
        // getSubitems:{type:types.primitives.Any}
    };

    constructor( options ) {
        options.columns = options.columns.map( col =>{
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
        });

        if (options.checkbox){
            options.columns.unshift({ view:Checkbox, options:{
                enable:!options.multiselect,
                links:{ value:"parent@selected" }},
                events:{ value:"parent@selected" }
            })
        }

        if (options.numerated){
            options.columns.unshift({ view:Html, options:{ links:{ html: "parent@index" } } })
        }


        super( options );

        if (this._options.resizable) {
            this.#initResize();
        }
        
        if (this._options.multiselect) {
            selection({
               $container: this.$tbody,
               $selector: 'tr',
               onSelect: ({add:addItems=[], remove:removeItems=[]}) =>{
                   addItems.forEach( $item => this.constructor.getItem( $item )?.set({selected:true}) );
                   removeItems.forEach( $item => this.constructor.getItem( $item )?.set({selected:false}) );
               }
            });
        }
        // if (this._options.getSubitems) {
        //     this.init_folder_open();
        // }
    }

    // init_folder_open() {
    //     this.breadcrumbs = [];
    //     this.$tbody.on("dblclick", e => {
    //         const row = $(e.target.closest('tr')).data("row");
    //         const item = row._options.data.get();
    //         this.add_breadcrumbs(row);
    //         this.open_folder(item);
    //     })
    //
    //     this.$breadcrumbs.on("click", e => {
    //         const idx = $(e.target).data("index");
    //         this.breadcrumbs = this.breadcrumbs.slice(0, idx + 1);
    //         this.open_folder(this.breadcrumbs[this.breadcrumbs.length - 1]);
    //     })
    // }

    // open_folder(item) {
    //     this.update_breadcrumbs();
    //     this.change_view(item);
    // }

    // change_view(item, view=GridRows) {
    //     const _pageSize = this._options.data.option("pageSize");
    //     const _controller = item ? this._options.getSubitems(item) : this._options.data;
    //     _controller.option("pageSize", _pageSize);
    //     const { tbody, pager } = this._widgets;
    //
    //     const tbody_options = tbody.get();
    //     delete tbody_options.data;
    //     tbody.destroy();
    //
    //     this._widgets.tbody = new view(tbody_options);
    //     const context = this.linkContext({data: _controller});
    //     this._widgets.tbody.link({...context, ...this._widgets , parent:this});
    //
    //     const pager_options = pager.get();
    //     delete pager_options.data;
    //     pager.destroy();
    //
    //     this._widgets.pager = new Pager(pager_options);
    //     this._widgets.pager.link({...context, ...this._widgets , parent:this});
    // }

    // add_breadcrumbs(row) {
    //     this.breadcrumbs.push(row._options.data.get());
    // }
    //
    // update_breadcrumbs() {
    //     this.$breadcrumbs.empty();
    //     if (this.breadcrumbs.length > 0) {
    //         $(`<div data-index="-1"> / </div>`).appendTo(this.$breadcrumbs);
    //     }
    //     this.breadcrumbs.forEach((item, idx) => {
    //         $(`<div data-index="${idx}"> ${item[".name"]} </div>`).appendTo(this.$breadcrumbs);
    //     })
    // }

    

    

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

        // widgets.tbody = {
        //     view: GridRows,
        //     options: {
        //         data: this._options.data,
        //         $container: this.$tbody,
        //         columns: this._options.columns,
        //         numerated: this._options.numerated,
        //         selectable: this._options.selectable,
        //         isFolder: this._options.isFolder,
        //         getIcon: this._options.getIcon
        //     }
        // }

        return widgets;
    }

    markup(){
        // const $markup = $(`<div class="${ style.grid } item_grid_container">
        //     <div class="${ style.wrapper } item_grid_table_container">
        //         <div class="${style.lasso} item_grid_lasso"></div>
        //         <div name="breadcrumbs" class="${style.breadcrumbs}"></div>
        //         <table class="${ style.table } item_grid_table">
        //             <thead name="header"></thead>
        //             <tbody name="tbody"></tbody>
        //             <tfoot name="footer"></tfoot>
        //         </table>
        //     </div>
        //     <div name="pager" class="${ style.pager_wrapper } item_grid_pager"></div>
        // </div>`);

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
        //this.$lasso = $markup.find(".item_grid_lasso");
        //this.$wrapper = $markup.find(".item_grid_table_container");
        //this.$breadcrumbs = $markup.find('[name="breadcrumbs"]');
        return $markup;
    };

    newItem( id, previousRow ){
        return new Row({
            id:id,
            $container: this.$tbody,
            columns: this._options.columns,
            numerated:this._options.numerated,
            selectable:!this._options.multiselect,
            parentRow:undefined,
            previousRow:previousRow
        });
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

            // TODO. What for?
            //onDrag({clientX: -1, buttons: 1});
        });
    }


    destroy() {
        this.heightObserver?.disconnect();
        super.destroy();
    }
}
Grid.extend();



