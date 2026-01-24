import { AuthView } from "@neondatabase/neon-js/auth/react";
import { useParams } from "react-router-dom";
import './LoginPage.css';


export const LoginPage = () => {
    const { pathname } = useParams();
    return (
        <div className="login-page">
		    <AuthView pathname={pathname} cardHeader={<h1 className="login-title">Wardrobe</h1>}/>
		</div>
    )
}