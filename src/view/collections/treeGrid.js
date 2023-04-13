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

import {types} from "../../types/index.js";
import {View as Grid, GridRows, Row as GridRow, Pager} from "./grid";
import style from "./grid.css";


export class View extends Grid{

    static options = {
        ...super.options,
        isFolder:{type:types.primitives.Any},
        getSubitems:{type:types.primitives.Any},
    };

    widgets(){
        const widgets = super.widgets();
        widgets.tbody = {
            view: TreeRows,
            options: {
                data: this._options.data,
                $container: this.$tbody,
                columns: this._options.columns,
                selectable:this._options.selectable,
                numerated:this._options.numerated,
                isFolder: this._options.isFolder,
                getSubitems: this._options.getSubitems,
                pager: this.get("pager")
            }
        }

        return widgets;
    }
}
View.extend();

class TreeRows extends GridRows{

    static options = {
        ...super.options,
        isFolder:{type:types.primitives.Any},
        getSubitems:{type:types.primitives.Any},
        pager:{type:types.primitives.Set}
    };


    constructor( options, depth=0, root=null ){
        super( options );
        this.depth = depth;
        this.root = root;
        if (this.root) {
            // this.createPager();
        }
    }

    createPager() {
        const idx = this._options.numerated ? 1 : 0;
        const checkbox = this._options.selectable ? 1 : 0;
        const colspan = this._options.columns.length + idx + checkbox;

        const $empty_td = '<td style="border-right: 1px solid transparent;"></td>';

        const $pagerWrapper = $(`<tr>
                ${ idx ? $empty_td : "" };
                ${ checkbox ? $empty_td : "" };
                <td
                    colspan=${colspan}
                    style="position: relative;z-index: 2;"
                >
                    <div name="pager"></div>
                </td>
            </tr>`);
        $pagerWrapper.insertAfter( this.root.$markup );
        const $container = $pagerWrapper.find("[name='pager']");
        this.$pagerWrapper = $pagerWrapper;
        this.pager = new Pager({
            ...this._options,
            $container,
            ...this.get("pager"),
            links: { page:"data@$.page", totalCount: "data@$.totalCount",pageSize:"data@$.pageSize" },
            events: { page:"data@$.page", pageSize: "data@$.pageSize" }
        });
    }

    destroy(){
        this.$pagerWrapper?.remove();
        this.$pagerWrapper = undefined;
        this.pager?.destroy();
        this.pager = undefined;
        super.destroy();
    }

    getRoot() {
        return this.root;
    }

    newItem( id ){
        return new Row({
            parent: this.root,
            id:id,
            $container: this._options.$container,
            isFolder:this._options.isFolder,
            getSubitems:this._options.getSubitems,
            columns:this._options.columns,
            numerated:this._options.numerated,
            selectable:this._options.selectable,
            depth:this.depth
        });
    }
}
TreeRows.extend();


class Row extends GridRow{

    static options = {
        ...super.options,
        isFolder:{type:types.primitives.Any},
        parent:{type:types.primitives.Any},
        getSubitems:{type:types.primitives.Any},
        depth:{type:types.primitives.Integer, default: 0},
        isOpen:{type:types.primitives.Bool},
        isLast:{type:types.primitives.Bool}
    };
    
    static events = {
        click: (event, _this, { data }) => {
            if ($(event.target).attr("name") === "tree-icon") {
                event.stopPropagation();
                _this._options.isOpen ? _this.close() : _this.open( data );
            }
        }
    }

    constructor( options ) {
        super( options );
        this.bind("isOpen", (val=false) => {
            this.$treeIcon.text(val ?  "-" : "+");
        })
        this.bind("isLast", (val=false) => {
            this.$lineWrapper.toggleClass(style.lastLine, val);
        })
    }

    appendColumns( $markup ) {
        const { depth, icon, parent } = this._options;
        this._options.columns.forEach((_,i)=> {
            if (i === 0 && this._options.isFolder( this._options.id )) {
                $(` <td>
                        <div class="${style.first_col_wrapper}">
                            <div
                                class="${style.lines} ${parent?.get("isLast") ?  style.hiddenLines : ""}"
                                name="line-wrapper"
                                style="width: ${depth * 20}px"
                            >
                                ${'<div></div>'.repeat(depth)}
                            </div>
                            <div name="tree-icon" class="${style.tree_icon} ${depth !== 0 ? style.connector : ""}">+</div>
                            <div name="${ i }" style="flex-shrink: 0;"></div>
                        </div>
                    </td>`).appendTo($markup);
            } else {
                $(`<td name="${ i }"></td>`).appendTo($markup);
            }
        });
        this.$treeIcon = $markup.find(`[name="tree-icon"]`);
        this.$lineWrapper = $markup.find('[name="line-wrapper"]')
    }

    open( data ) {
        this.set({isOpen: true});
        this._childrenController = this._options.getSubitems(data.get());
        this._children = new TreeRows({...this._options, data: this._childrenController}, this._options.depth+1, this);
    }

    close() {
        if (!this.get("isOpen")) {
            return;
        }
        this.set({isOpen: false});
        this.destroyChildren();
    }

    destroyChildren() {
        this._children?.destroy();
        this._children = undefined;
        this._childrenController?.destroy();
        this._childrenController = undefined;
    }
    destroy(){
        this.destroyChildren();
        super.destroy();
    }
}
Row.extend();
