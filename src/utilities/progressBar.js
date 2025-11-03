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

import {item} from "../index.js";
import {types} from "../types/index.js";

/**
 * Creates a progress bar with a controller for management
 * 
 * @param {Object} options - Configuration options for the progress bar
 * @param {Object} [options.dataOptions] - Data controller options (extends entire Item config)
 * @param {Object} [options.dataOptions.schema] - Data controller schema
 * @param {Object} [options.dataOptions.schema.value] - Schema for progress value
 * @param {Object} [options.dataOptions.schema.validate] - Schema for validation (min/max)
 * @param {Object} [options.windowOptions] - Window options (extends entire Window config)
 * @param {number} [options.windowOptions.width=450] - Window width
 * @param {number} [options.windowOptions.height=60] - Window height
 * @param {Object} [options.windowOptions.view] - Window view configuration
 * 
 * @returns {Promise<Object>} Promise that resolves with progress bar controller object:
 * @returns {Function} setValue - Sets progress value. Parameters: (value: number)
 * @returns {Function} getValue - Returns current progress value
 * @returns {Function} increment - Increases progress. Parameters: (step: number = 10)
 * @returns {Function} reset - Resets progress to minimum value
 * @returns {Function} complete - Sets progress to maximum value
 * @returns {Function} destroy - Destroys the progress bar window
 * 
 * @example
 * // Basic usage
 * const progress = await progressBar();
 * progress.setValue(50);
 * progress.increment(10);
 * progress.destroy();
 * 
 * @example
 * // Custom value range
 * const progress = await progressBar({
 *   dataOptions: {
 *     data: {
 *       value: 50,
 *       validate: { min: 0, max: 200 }
 *     }
 *   }
 * });
 * 
 * @example
 * // Custom window configuration
 * const progress = await progressBar({
 *   windowOptions: {
 *     width: 600,
 *     height: 100,
 *     title: 'Loading...'
 *   }
 * });
*/

export function progressBar(options = {}) {
    return new Promise((resolve) => {
        const data = new item.controllers.Item({
            schema: {
                value: {type: types.primitives.Float, default: 0},
                validate: {
                    type: types.complex.Item, 
                    options: {
                        schema: {
                            min: {type: types.primitives.Float, default: 0},
                            max: {type: types.primitives.Float, default: 100}
                        }
                    }
                },
            },
            data: {
                value: 0,
                validate: {min: 0, max: 100},
            },
            ...options.dataOptions
        });

        const window = new item.view.layout.Window({
            view: {
                view: item.view.controls.ProgressBar,
                options: {
                    data,
                    links:{value:"value"}
                }
            },
            width:450,
            height:60,
            ...options.windowOptions
        });

        resolve({
            setValue(value) {
                data.set({value});
            },

            getValue() {
                return data.get('value');
            },

            increment(step = 10) {
                const current = this.getValue();
                const max = data.get('validate').max;
                this.setValue(Math.min(current + step, max));
            },

            reset() {
                const min = data.get('validate').min;
                this.setValue(min);
            },

            complete() {
                const max = data.get('validate').max;
                this.setValue(max);
            },

            destroy() {
                window.destroy();
            }
        });
    });
}