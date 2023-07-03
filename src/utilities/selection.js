//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2021 vzroman
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

import style from "../view/collections/grid.css";

export class Selection {
    constructor( options ){

        this._options = {...{
            container: undefined,
            selector: undefined
        }, ...options};

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
            this.setSelecterRows();
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
                    this.setSelecterRows();
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

            this.setSelecterRows();
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

    setSelecterRows() {
        const rows = this.$tbody.find(`tr[data-row_id]`).toArray().map(row => $(row).data("row"));
        rows.forEach(row => {
            const selected = this.selected.includes(row.get("id"));
            row.set({ selected });
        });
        this._trigger("onSelect", [this.selected]);
    }
}

