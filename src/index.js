import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from '@mui/material';
import { PSATheme } from 'shared-react-components/src';
import '@fontsource/ibm-plex-sans';

// import {BrowserRouter, Route, RouterProvider, Switch} from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import FindMissions from './pages/find_missions/find_missions';
import Explore from './pages/explore/explore';
import DrawPlots from './pages/draw_plots/draw_plots';
import PlotFeatures from './pages/plot_features/plot_features';
import ErrorPage from './pages/error_page';
import FeedbackComponent from './pages/Feedback/feedback';

function computeBasename() {
  const path = window.location.pathname;

  // Local dev or root deployment
  if (path === "/" || path === "") {
    return "/";
  }

  // OOD case: /pun/dev/<appname>/  → basename = /pun/dev/<appname>
  return path.replace(/\/$/, "");
}

const basename = computeBasename();

console.log("Router basename:", basename);

const router = createBrowserRouter(
  [
    {
      path: "/explore",
      element: <Explore />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/draw-plots",
      element: <DrawPlots />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/plot-features",
      element: <PlotFeatures />,
    },
    {
      path: "/feedback",
      element: <FeedbackComponent />,
    },
    {
      path: "/",
      element: <FindMissions />,
      errorElement: <ErrorPage />,
    },
  ],
  { basename }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={PSATheme}>
      <RouterProvider router = {router} />
    </ThemeProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
