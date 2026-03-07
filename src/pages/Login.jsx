import { useState } from "react";

export default function Login(){

const [user,setUser]=useState("")
const [pass,setPass]=useState("")

function login(){

if(user==="admin" && pass==="1234"){
localStorage.setItem("login","true")
window.location="/"
}else{
alert("Wrong login")
}

}

return(

<div>

<h2>RKM Ledger Login</h2>

<input
placeholder="Username"
onChange={(e)=>setUser(e.target.value)}
/>

<input
type="password"
placeholder="Password"
onChange={(e)=>setPass(e.target.value)}
/>

<button onClick={login}>
Login
</button>

</div>

)

}
