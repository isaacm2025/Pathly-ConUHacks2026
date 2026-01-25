import Home from './pages/Home';
import Landing from './pages/Landing';
import Index from './pages/Index';
import EmergencyContacts from './pages/EmergencyContacts';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Landing": Landing,
    "Index": Index,
    "EmergencyContacts": EmergencyContacts,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};
