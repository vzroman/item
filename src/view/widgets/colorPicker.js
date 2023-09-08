import {View as ItemView} from "../item.js";
import {types} from "../../types";
import {controls} from "../controls";
import {layout} from "../layout";
import style from "../widgets/colorPicker.css";

export class ColorPicker extends ItemView {

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
        
        const $colorValue = this.$markup.find("[name='color-value']");
        const $colorPreview = $colorValue.next();

        this.bind("value", value => {
            $colorValue.text(value);
            $colorPreview.css({"background-color": value});
        });
    }

    _openColorModal() {
        const _this = this;
        _this.$markup.attr("disabled", true);
        
        const dialog = new layout.Window({
            view:{
                view: ColorForm,
                options: {
                    events:{
                        onCancel: () => {
                            dialog.destroy();
                            _this.$markup.attr("disabled", false);
                        },
                        onSelect: value => {
                            dialog.destroy();
                            _this.$markup.attr("disabled", false);
                            _this.set({value});
                        }
                    },
                    selected: this._options.value
                }
            },
            actions: ["close"],
            title: "Color select"
        });
    }

}

ColorPicker.extend();

class ColorForm extends ItemView {
    static events = { onSelect: true, onCancel: true };

    static options = {
        selected: { type: types.primitives.String, default: "#000" },
    };

    static markup = `<div style="display:flex; flex-direction:column; align-items:stretch;width:100%;height:100%;">
        <div style="display: flex; gap: 10px; padding: 10px">
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
                    <label for="selected-color">#00000</label>
                </div>
            </div>
        </div>
        <div style="display:flex;justify-content: flex-end; margin-top: 12px;">
            <div name="cancel" style="margin-right:12px;"></div>
            <div name="ok"></div>
        </div>
    </div>`;

    constructor(options) {
        super(options);
        this._renderColorCells();

        const $table = this.$markup.find('[name="color-table"]');
        const $input = this.$markup.find('[name="selected-color"]');
        const $label = $input.next();

        const _this = this;

        $table.on("click", (e) => {
            const color = $(e.target).attr("aria-label");
            _this.set({selected: color})
        });

        $input.on("input", function() { _this.set({selected: $(this).val()}); });
        
        this.bind("selected", (selected) => {
            $input.val(selected);
            $label.text(selected);
        });
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
                            source: "parent@selected",
                            handler: (v) => v === "transparent",
                        },
                    },
                    events: {
                        value: {
                            handler: (isTransparent) => {
                                if (isTransparent) {
                                    this.set({ selected: "transparent" });
                                } else {
                                    if (this.get("selected") === "transparent") {
                                        this.set({ selected: "#000" });
                                    }
                                }
                            },
                        },
                    },
                },
            },
            ok: {
                view: controls.Button,
                options: {
                    text: "OK",
                    links: {
                        enable: {
                            source: "parent@selected",
                            handler: (v) => v,
                        },
                    },
                    events: {
                        click: {
                            handler: () => this._trigger("onSelect", [this._options.selected]),
                        },
                    },
                },
            },
            cancel: {
                view: controls.Button,
                options: {
                    text: "Отмена",
                    events: {
                        click: { handler: () => this._trigger("onCancel") },
                    },
                },
            },
        };
    }
}

ColorForm.extend();