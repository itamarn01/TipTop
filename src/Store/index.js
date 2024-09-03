import Reducor from "./Reducor";
//import { configureStore } from '@reduxjs/toolkit'

//const store = configureStore( Reducor)
import { createStore } from "redux";

const store = createStore(Reducor);

export default store;
