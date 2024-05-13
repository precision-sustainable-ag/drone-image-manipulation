import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
// import App from './pages/orthomosaic_display/App';
import reportWebVitals from './reportWebVitals';

// import {BrowserRouter, Route, RouterProvider, Switch} from 'react-router-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './pages/orthomosaic_display/App';
import ErrorPage from './pages/error_page';
import PlotTable from './pages/plot_features/plot_table';
import SpatialMap from './pages/SpatialQuery/map';
import FeedbackComponent from './pages/Feedback/feedback';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// const App = () => {
//   return (
//     <BrowserRouter>
//       <Switch>
//         <Route exact path='/' component={geotiffPage} />
//         <Route path='/plot-features' component={plotTable} />
//       </Switch>
//     </BrowserRouter>
//   );
// }

// ReactDOM.render(<App/>, document.getElementById('root'));

const router = createBrowserRouter([
  {
    path: '/explore',
    element: <App />,
    errorElement: <ErrorPage />
  },
  {
    path: '/plot-features',
    element: <PlotTable />,
  },
  {
    path: '/feedback',
    element: <FeedbackComponent />,
  },
  {
    path: '/',
    element: <SpatialMap />,
    errorElement: <ErrorPage />
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router = {router} />
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
