const AboutUsPage = () => {
  return (
    <div className="space-y-8">
      {/* About Us */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-light text-foreground mb-4">About us</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Lawra is an online platform that allows employees to have access to loan services within an organisation.
          Traditionally, loans are applied for by individuals from any bank of choice for various purposes, with varying
          interest rate packages paid at the end of a specified period/tenor.
        </p>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-light text-foreground mb-4">Terms and Conditions</h2>
        <h3 className="text-sm font-semibold text-foreground mb-2">WHY BOND APP</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Making employees as comfortable as possible is achievable, this is not to say organizations have the
          responsibility of providing all their needs. Every now and then human needs are increasing beyond the salaries
          earned, and there is a need to meet up to them if not all.
        </p>
      </div>

      {/* Language */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-light text-foreground mb-4">Language</h2>
        <p className="text-sm text-muted-foreground">English</p>
      </div>

      {/* Website */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-light text-foreground mb-4">Website</h2>
        <p className="text-sm text-primary hover:underline cursor-pointer">www.lawra.com</p>
      </div>
    </div>
  );
};

export default AboutUsPage;
