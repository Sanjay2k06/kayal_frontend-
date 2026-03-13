const Footer = () => (
  <footer className="border-t bg-card/60 py-12">
    <div className="container mx-auto px-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div>
          <span className="font-display text-lg font-bold text-foreground">CiviX</span>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered civic assistance for every citizen.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CiviX. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
