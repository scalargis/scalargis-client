import ReactGA from "react-ga4";

export const initGA = (trackingID) => {
  ReactGA.initialize(trackingID);
};

export const PageView = () => {
  ReactGA.send({
    hitType: "pageview",
    page: window.location.pathname + window.location.search,
  });
};
