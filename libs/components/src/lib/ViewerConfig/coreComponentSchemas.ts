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
import MainMenuHtmlContent from '../MainMenuHtmlContent.config.schema.json';
import MapControls from '../MapControls/src/config.schema.json';
import MapScaleInput from '../MapScaleInput/src/config.schema.json';
import MapScaleLine from '../MapScaleLine/src/config.schema.json';
import MapTools from '../MapTools/src/config.schema.json';
import PanelHTML from '../PanelHTML/src/config.schema.json';
import PanelJSON from '../PanelJSON/src/config.schema.json';
import PlacesSearch from '../PlacesSearch/src/config.schema.json';
import PopupInfo from '../PopupInfo/src/config.schema.json';
import Print from '../Print/src/config.schema.json';
import SearchLayers from '../SearchLayers/src/config.schema.json';
import StreetView from '../StreetView/src/config.schema.json';
import ThemeWizard from '../ThemeWizard/src/config.schema.json';
import Timeline from '../Timeline/src/config.schema.json';
import TOC from '../TOC/src/config.schema.json';
import URLlayers from '../URLlayers/src/config.schema.json';
import URLparams from '../URLparams/src/config.schema.json';
import UserLogin from '../UserLogin/src/config.schema.json';

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
  LocaleSelector,
  MainMenuHtmlContent,
  MapControls,
  MapScaleInput,
  MapScaleLine,
  MapTools,
  PanelHTML,
  PanelJSON,
  PlacesSearch,
  PopupInfo,
  Print,
  SearchLayers,
  StreetView,
  ThemeWizard,
  Timeline,
  TOC,
  URLlayers,
  URLparams,
  UserLogin
} as unknown as Record<string, JsonSchema>;
