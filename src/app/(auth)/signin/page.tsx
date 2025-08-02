const SignIn = () => {
  return (
    <div>
      {/* generate a form to sign in */}
      <form>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default SignIn;
