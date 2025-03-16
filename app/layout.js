export default function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Whis</title>
        <link rel="icon" href="logo.ico" />
      </head>
      <body>
        <header>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
