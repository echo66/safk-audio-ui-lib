import { AbstractTimeAxisGenerator } from './src/helpers/abstract-time-axis-generator.js';
window.AbstractTimeAxisGenerator = AbstractTimeAxisGenerator
import { BarTimeAxisGenerator } from './src/helpers/bar-time-axis-generator.js';
window.BarTimeAxisGenerator = BarTimeAxisGenerator
import { SelectionManager } from './src/helpers/selection-manager.js';
window.SelectionManager = SelectionManager
import { SimpleTimeAxisGenerator } from './src/helpers/simple-time-axis-generator.js';
window.SimpleTimeAxisGenerator = SimpleTimeAxisGenerator
import { TimeScroller } from './src/helpers/time-scroller.js';
window.TimeScroller = TimeScroller

import { SimpleEditController } from './src/interaction-controllers/simple-edit-controller.js';
window.SimpleEditController = SimpleEditController
import { SimplePointEditController } from './src/interaction-controllers/simple-point-edit-controller.js';
window.SimplePointEditController = SimplePointEditController
import { SimpleSegmentEditController } from './src/interaction-controllers/simple-segment-edit-controller.js';
window.SimpleSegmentEditController = SimpleSegmentEditController

import { HTMLSegmentsLayer } from './src/layers/html-segments-layer.js';
window.HTMLSegmentsLayer = HTMLSegmentsLayer
import { Layer } from './src/layers/layer.js';
window.Layer = Layer
import { MarkersLayer } from './src/layers/markers-layer-v2.js';
window.MarkersLayer = MarkersLayer
import { PathsLayer } from './src/layers/paths-layer-v2.js';
window.PathsLayer = PathsLayer
import { PointsLayer } from './src/layers/points-layer-v2.js';
window.PointsLayer = PointsLayer
import { SegmentsLayer } from './src/layers/segments-layer-v2.js';
window.SegmentsLayer = SegmentsLayer
import { TimeAxisLayer } from './src/layers/time-axis-layer-v2.js';
window.TimeAxisLayer = TimeAxisLayer
import { WaveformsSegmentsLayer } from './src/layers/waveforms-segments-layer.js';
window.WaveformsSegmentsLayer = WaveformsSegmentsLayer

import { EventEmitter } from './src/utils/event-emitter.js';
window.EventEmitter = EventEmitter
import { linear } from './src/utils/linear-scale.js';
window.linear = linear
import { List } from './src/utils/list.js';
window.List = List
import { WaveformsRenderingController } from './src/utils/waveforms-rendering-controller.js';
window.WaveformsRenderingController = WaveformsRenderingController