import {Control} from "./control.js";
import {types} from "../../types";
import {controls} from "./index";
import {layout} from "../layout";
import {Controller} from "../../controllers/item";
import style from "./colorPicker.css";

export class ColorPicker extends Control {
    static events = { onChange: true };

    static options = {
        value:{type:types.primitives.String, default: "#000"},
    };

    static markup = `<button class="${style.colorBtn}">
        <div name="color-value" class="${style.colorValue}"></div>
        <div name="color-preview" class="${style.colorPreview}"></div>
    </button>`;
 
    constructor( options ) {
        super( options );
        this.$markup.on("click", () => { this._openColorModal(); });
        
        this.$colorValue = this.$markup.find("[name='color-value']");
        this.$colorPreview = this.$markup.find("[name='color-preview']");
    }

    updateValue( value, prev ){
        this.$colorValue.text(value);
        this.$colorPreview.css({"background-color": value});
    }


    _openColorModal() {
        const controller = new Controller({
            schema:{ value:{ type: types.primitives.String, required:true } },
            autoCommit:false,
            data:{value:this._options.value}
        });

        controller.bind("commit",()=>this.set({value: controller.get("value") }));

        new layout.FormWindow({
            data:controller,
            view:{
                view: ColorForm,
                options: {
                    links:{ value:"value" },
                    events:{ value:"value" }
                }
            },
            modal:true,
            actions: ["close"],
            title: "Color select",
            events:{
                destroy:()=> controller.destroy()
            }
        });
    }

}

ColorPicker.extend();

class ColorForm extends Control {

    static options = {
        value: { type: types.primitives.String, default: "#000" },
    };

    static markup = `<div style="display: flex; gap: 10px; padding: 10px">
        <div>
            <div name="transparent" style="margin-bottom: 10px; display: flex; align-items: center; gap: 5px">
                <label>Transparent</label>
            </div>
            <div name="colorpalette">
                <table name="color-table" class="${style.table}"><tbody name="color-tbody"></tbody></table>
            </div>
        </div>
        <div>
            <div style="min-width: 130px;">
                <input type="color" value="#00000" id="selected-color" name="selected-color" />
                <label for="selected-color" name="selected-color-label">#00000</label>
            </div>
        </div>
    </div>`;

    constructor(options) {
        super(options);
        this._renderColorCells();

        this.$table = this.$markup.find('[name="color-table"]');
        this.$input = this.$markup.find('[name="selected-color"]');
        this.$label = this.$markup.find('[name="selected-color-label"]');


        this.$table.on("click", (e) => {
            const color = $(e.target).attr("aria-label");
            this.set({value: color})
        });

        this.$input.on("change", ()=> {
            this.set({value: this.$input.val()});
        });
    }

    updateValue( value, prev ){
        this.$input.val(value);
        this.$label.text(value);
    }

    _colors() {
        return [
            ["#000000", "#ffffff", "#f4f4f4", "#eaeaea"],
            ["#d3d3d3", "#bcbcbc", "#959595", "#747474"],
            ["#505050", "#323232", "#378ef0", "#0d66d0"],
            ["#ec5b62", "#c9252d", "#f29423", "#cb6f10"],
            ["#33ab84", "#12805c", "#6767ec", "#4646c6"],
            ["#c4884b", "#654321", "#d83790", "#ae0e66"],
            ["#dfbf00", "#b79900", "#c038cc", "#93219e"],
            ["#85d044", "#6aa834", "#9256d9", "#6f38b1"],
        ];
    }

    _renderColorCells() {
        const $tbody = this.$markup.find('[name="color-tbody"]');

        for (const colors of this._colors()) {
            const $tr = $(`<tr role="row"></tr>`).appendTo($tbody);

            for (const color of colors) {
                $(`<td class="${style.td}" role="gridcell" unselectable="on" aria-label="${color}"></td>`).css({
                    width: "40px", 
                    height: "40px", 
                    "background-color": color,
                    cursor: "pointer"
                }).appendTo($tr);
            }
        }
    }

    widgets() {
        return {
            transparent: {
                view: controls.Checkbox,
                options: {
                    links: {
                        value: {
                            source: "parent@value",
                            handler: (v) => v === "transparent",
                        },
                    },
                    events: {
                        value: {
                            handler: (isTransparent) => {
                                if (isTransparent) {
                                    this.set({ value: "transparent" });
                                } else if (this.get("value") === "transparent") {
                                    this.set({ value: "#000" });
                                }
                            },
                        },
                    },
                },
            }
        };
    }
}
ColorForm.extend();