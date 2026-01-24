import Home from './pages/Home';
import Index from './pages/Index';
import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Index": Index,
    "Landing": Landing,
    "SignUp": SignUp,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};
