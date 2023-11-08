import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import style from "./splitter.css";

export class Splitter extends ItemView {
    static options = {
        // panes: {type: types.primitives.Array, default:[]},
        orientation: {type: types.primitives.String, default: "horizontal"},
        height: {type: types.primitives.String, default: "100%"},
        width: {type: types.primitives.String, default: "100%"},
    };

    constructor(options) {
        const $container = options.$container;

        super(options);

        const $elements = $container.children();

        const isVertical = this._options.orientation === "vertical";

        if ($elements.length < 2) {
            throw new Error("Container must contain at least two elements.");
        }

        $container.empty();

        const innerContainer = $(`<div class="${style["e-splitter"]}" style="height: ${this._options.height}; width: ${this._options.width};"></div>`);

        if (isVertical) {
            innerContainer.addClass(style["e-splitter-vertical"]);
        } else {
            innerContainer.addClass(style["e-splitter-horizontal"]);
        }

        innerContainer.appendTo($container);
        
        const $handles = [];

        const $items = [];

        let orderN = 0;

        const orientation = this._options.orientation;

        function getInitialFlexBasis(value, paneLength) {
            let initialFlexBasis = (value - (8 * paneLength - 1)) / paneLength;
            initialFlexBasis = ((initialFlexBasis / value) + ((8 / paneLength) / value)) * 100;
            return {initialFlexBasis, value};
        }
        
        const paneLength = $elements.length;

        let {initialFlexBasis, value: containerValue} = getInitialFlexBasis(isVertical ? innerContainer.height() : innerContainer.width(), paneLength);

        $elements.each(function(index, $element) {
           
            $element = $($element);

            if (orderN > 0) { orderN += 1; }
            
            const paneShell = $(`<div class="${style["e-pane"]} ${style["e-pane-horizontal"]}"></div>`);

            const paneStyle = {"order": orderN + ""};

            if (index + 1 !== $elements.length) {
                // paneStyle['flex-basis'] = `${initialFlexBasis}%`;
                paneShell.addClass(style["e-static-pane"]);
            }

            paneShell.css(paneStyle);

            $element.appendTo(paneShell);

            orderN += 1;

            $items.push(paneShell);
            
            const $handle = $(`<div 
                class="${style.splitbar} ${isVertical ? style.vertical : style.horizontal}" 
                style="order: ${orderN}" 
                tabindex="0" 
                role="separator" 
                aria-orientation="${orientation}">
                <div class="${isVertical ? style.handle_v : style.handle_h}"></div>
            </div>`);

            if (index + 1 !== $elements.length) { 
                $handle.insertAfter($element); 
                $handles.push($handle);
                $items.push($handle);
            } 
        });

        $items.forEach(i => $(i).appendTo(innerContainer));

        $handles.forEach(function(item, idx) {
            const leftSide = item.prev();
            const rightSide = item.next();

            let coords;

            item.on("mousedown", mouseDownHandler);

            function mouseDownHandler(e) {
                // leftSide.width() doesnt return correct width i.e 48px instead of 0px

                const {width: firstWidth, height: firstHeight} = leftSide[0].getBoundingClientRect();
                const {width: secondWidth, height: secondHeight} = rightSide[0].getBoundingClientRect();

                coords = {
                    e,
                    firstWidth,
                    secondWidth,
                    firstHeight,
                    secondHeight
                };

                containerValue = innerContainer.width();

                if (isVertical) {
                    containerValue = innerContainer.height();
                }
              
                document.addEventListener("mousemove", mouseMoveHandler);
                document.addEventListener("mouseup", mouseUpHandler);
            }

            function mouseMoveHandler(e) {
                const delta = {
                    x: e.clientX - coords.e.clientX,
                    y: e.clientY - coords.e.clientY
                };

                const styles = {};

                if (isVertical) {
                    delta.x = Math.min(Math.max(delta.y, -coords.firstHeight), coords.secondHeight);

                    styles.left = {"flex-basis": ((coords.firstHeight + delta.x )* 100) / containerValue + "%"};

                    if (idx !== $handles.length - 1) {
                        styles.right = {
                            "flex-basis": ((coords.secondHeight - delta.x) * 100) / containerValue + "%"
                        };
                    }

                } else {
                    delta.x = Math.min(Math.max(delta.x, -coords.firstWidth), coords.secondWidth);

                    styles.left = {"flex-basis": ((coords.firstWidth + delta.x )* 100) / containerValue + "%"};

                    if (idx !== $handles.length - 1) {
                        styles.right = {
                            "flex-basis": ((coords.secondWidth - delta.x) * 100) / containerValue + "%"
                        };
                    }
                }

                leftSide.css(styles.left);
                rightSide.css(styles?.right || {});
                              
            }

            function mouseUpHandler() {
                document.removeEventListener("mousemove", mouseMoveHandler);
                document.removeEventListener("mouseup", mouseUpHandler);
            }
        });

    }
}