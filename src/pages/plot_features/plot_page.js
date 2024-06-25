import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PlotMap from './plot_map';
import PlotTable from './plot_table';

const PlotPage = () => {
    const location = useLocation();
    const { state } = location;
    console.log("plot page", state);
    console.log("plot page",state['features']);
    console.log("plot page",state['flight_details']);

    if (!state || !state.features || !state.flight_details) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <PlotMap apiOutput={state} />
            <PlotTable state={state} />
        </div>
    );
}
export default PlotPage;