import Home from './pages/Home';
import Landing from './pages/Landing';
import Index from './pages/Index';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Landing": Landing,
    "Index": Index,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};