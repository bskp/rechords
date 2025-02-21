import * as React from "react";
import DocumentTitle from "react-document-title";
import { useMatomo } from "@datapunt/matomo-tracker-react";
import { useLocation } from "react-router-dom";
import { Meteor } from "meteor/meteor";

interface TrackingDocumentTitleProps {
  title: string;
  track_as?: string;
}

const TrackingDocumentTitle = ({
  title,
  track_as,
}: TrackingDocumentTitleProps) => {
  const location = track_as || useLocation().pathname;
  const { trackPageView } = useMatomo();
  React.useEffect(() => {
    trackPageView({
      customDimensions: [
        {
          id: 1,
          value: Meteor.user()?.profile.name,
        },
        {
          id: 2,
          value: Meteor.user()?.profile.role,
        },
      ],
    });
  }, [location]);

  return <DocumentTitle title={title} />;
};

export default TrackingDocumentTitle;
