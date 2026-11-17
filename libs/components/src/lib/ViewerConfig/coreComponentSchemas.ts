import type { JsonSchema } from '@jsonforms/core';
import AttributesTable from '../AttributesTable/src/config.schema.json';
import Basemaps from '../Basemaps/src/config.schema.json';
import ContactForm from '../ContactForm/src/config.schema.json';
import Coordinates from '../Coordinates/src/config.schema.json';
import CRSSelect from '../CRSSelect/src/config.schema.json';
import DocumentBrowser from '../DocumentBrowser/src/config.schema.json';
import DrawTools from '../DrawTools/src/config.schema.json';
import ExportMapFeatures from '../ExportMapFeatures/src/config.schema.json';
import FeatureInfo from '../FeatureInfo/src/config.schema.json';
import GeoLocation from '../GeoLocation/src/config.schema.json';
import HelpButton from '../HelpButton/src/config.schema.json';
import HtmlContent from '../HtmlContent.config.schema.json';
import IntersectLayers from '../IntersectLayers/src/config.schema.json';
import LayerAttributesTable from '../LayerAttributesTable/src/config.schema.json';
import LayerCompare from '../LayerCompare/src/config.schema.json';
import LayerDownload from '../LayerDownload/src/config.schema.json';
import LayerEdit from '../LayerEdit/src/config.schema.json';
import LayerMetadata from '../LayerMetadata/src/config.schema.json';
import LayerOpacity from '../LayerOpacity/src/config.schema.json';
import LayerRemove from '../LayerRemove/src/config.schema.json';
import LocaleSelector from '../LocaleSelector/src/config.schema.json';

/** The config_json schema of each core component, by component type. */
export const coreComponentSchemas: Record<string, JsonSchema> = {
  AttributesTable,
  Basemaps,
  ContactForm,
  Coordinates,
  CRSSelect,
  DocumentBrowser,
  DrawTools,
  ExportMapFeatures,
  FeatureInfo,
  GeoLocation,
  HelpButton,
  HtmlContent,
  IntersectLayers,
  LayerAttributesTable,
  LayerCompare,
  LayerDownload,
  LayerEdit,
  LayerMetadata,
  LayerOpacity,
  LayerRemove,
  LocaleSelector
} as unknown as Record<string, JsonSchema>;
