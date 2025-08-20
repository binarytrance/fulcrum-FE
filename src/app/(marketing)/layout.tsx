const Layout = ({ children }: { children: React.ReactNode }) => {
  // TODO: if session is present, redirect to /goals page instead of showing the marketing page
  return <div>{children}</div>;
};

export default Layout;
