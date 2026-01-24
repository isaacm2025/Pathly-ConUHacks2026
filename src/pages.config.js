import Home from './pages/Home';
import Landing from './pages/Landing';
import Index from './pages/Index';
import SignUp from './pages/SignUp';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Landing": Landing,
    "Index": Index,
    "SignUp": SignUp,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};
