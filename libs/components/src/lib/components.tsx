import * as AttributesTable from './AttributesTable/src/Main'
import * as Basemaps from './Basemaps/src/Main'
import * as ContactForm from './ContactForm/src/Main'
import * as Coordinates from './Coordinates/src/Main'
import * as CRSSelect from './CRSSelect/src/Main'
import * as DrawTools from './DrawTools/src/Main'
import * as drawEditing from './DrawTools/src/editing'
import * as ExportMapFeatures from './ExportMapFeatures/src/Main'
import * as FeatureInfo from './FeatureInfo/src/Main'
import * as GeoLocation from './GeoLocation/src/Main'
import * as HelpButton from './HelpButton/src/Main'
import * as HtmlContent from './HtmlContent'
import * as LayerAttributesTable from './LayerAttributesTable/src/Main'
import * as LayerCompare from './LayerCompare/src/Main'
import SliderLayersMapControl from './LayerCompare/src/SliderLayersMapControl'
import useLayerSwipe from './LayerCompare/src/useLayerSwipe'
import * as LayerDownload from './LayerDownload/src/Main'
import * as LayerEdit from './LayerEdit/src/Main'
import * as LayerMetadata from './LayerMetadata/src/Main'
import * as LayerOpacity from './LayerOpacity/src/Main'
import * as LayerRemove from './LayerRemove/src/Main'
import * as LocaleSelector from './LocaleSelector/src/Main'
import * as MainMenuHtmlContent from './MainMenuHtmlContent'
import * as MapControls from './MapControls/src/Main'
import * as MapScaleInput from './MapScaleInput/src/Main'
import * as MapScaleLine from './MapScaleLine/src/Main'
import * as MapTools from './MapTools/src/Main'
import * as PanelHTML from './PanelHTML/src/Main'
import * as PanelJSON from './PanelJSON/src/Main'
import * as PlacesSearch from './PlacesSearch/src/Main'
import * as PopupInfo from './PopupInfo/src/Main'
import * as Print from './Print/src/Main'
import * as SearchLayers from './SearchLayers/src/Main'
import * as StreetView from './StreetView/src/Main'
import * as ThemeWizard from './ThemeWizard/src/Main'
import * as TOC from './TOC/src/Main'
import * as DocumentBrowser from './DocumentBrowser/src/Main'
import DocumentList from './DocumentBrowser/src/DocumentList'
import Legend from './TOC/src/TOC/Legend'
import * as Timeline from './Timeline/src/Main'
import * as UserLogin from './UserLogin/src/Main'
import LoginWidget from './UserLogin/src/LoginWidget'
import RegistrationWidget from './UserLogin/src/RegistrationWidget'
import ResetPasswordWidget from './UserLogin/src/ResetPasswordWidget'
import ResendConfirmationButton from './UserLogin/src/ResendConfirmationButton'
import * as URLparams from './URLparams/src/Main'
import * as IntersectLayers from './IntersectLayers/src/Main'
import IntersectResults from './IntersectLayers/src/IntersectResults'
import ResultsTablesTabs from './IntersectLayers/src/components/ResultsTablesTabs'
import * as URLlayers from './URLlayers/src/Main'

import DrawingToolbar from './DrawingToolbar'
import MainMenuButton from './MainMenuButton'
import MapToolButton from './MapToolButton'
import ProgressControl from './ProgressControl'
import ScriptHtmlContent from './ScriptHtmlContent'

import PasswordRules, {
  fetchPasswordPolicy,
  resetPasswordPolicyCache,
  usePasswordPolicy,
  getPasswordRules,
  validatePasswordAgainstPolicy
} from './PasswordRules'

import { 
  JsonForm, 
  JsonFormContext,
  JsonFormDefaultRenderers,
  FormErrors,
  useFigTreeEvaluator,
  ValidationMode
} from './JsonForm'

import * as i18n from './utils/i18n';
import * as utils from './utils/common';
import { runJob, JobError } from './utils/jobs';
import { useComponentTour, componentTourListed } from './utils/componentTour';


import  LocaleSelectorComponent from  './LocaleSelector/src/LocaleSelector';


export {
  AttributesTable,
  Basemaps,
  ContactForm,
  CRSSelect,
  Coordinates,
  DrawTools,
  drawEditing,
  ExportMapFeatures,
  FeatureInfo,
  GeoLocation,
  HelpButton,
  HtmlContent,
  LayerAttributesTable,
  LayerCompare,
  SliderLayersMapControl,
  useLayerSwipe,
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
  TOC,
  UserLogin,
  LoginWidget,
  RegistrationWidget,
  ResetPasswordWidget,
  ResendConfirmationButton,
  URLparams,
  Timeline,
  DocumentBrowser,
  DocumentList,
  IntersectLayers,
  IntersectResults,
  ResultsTablesTabs,
  URLlayers,

  Legend,

  DrawingToolbar,
  MainMenuButton,
  MapToolButton,
  ProgressControl,
  ScriptHtmlContent,

  PasswordRules,
  fetchPasswordPolicy,
  resetPasswordPolicyCache,
  usePasswordPolicy,
  getPasswordRules,
  validatePasswordAgainstPolicy,

  JsonForm,
  JsonFormContext,
  JsonFormDefaultRenderers,
  FormErrors,
  useFigTreeEvaluator,
  ValidationMode as JsonFormValidationMode,

  i18n,
  utils,
  runJob,
  JobError,
  useComponentTour,
  componentTourListed,

  LocaleSelectorComponent
};