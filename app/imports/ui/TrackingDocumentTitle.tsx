import * as React from "react";
import { useMatomo } from "@datapunt/matomo-tracker-react";
import { useLocation } from "react-router-dom";
import { Meteor } from "meteor/meteor";

interface TrackingDocumentTitleProps {
  title: string;
  track_as?: string;
}

const useDocumentTitle = (title: string) => {
  React.useEffect(() => {
    document.title = title;
  }, [title]);
};

const TrackingDocumentTitle = ({
  title,
  track_as,
}: TrackingDocumentTitleProps) => {
  const location = track_as || useLocation().pathname;
  const { trackPageView } = useMatomo();

  useDocumentTitle(title);

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

  return null;
};

export default TrackingDocumentTitle;
