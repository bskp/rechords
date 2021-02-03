import * as React from 'react';
import * as DocumentTitle from 'react-document-title';
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { useLocation } from 'react-router-dom';
import { TrackEventParams } from '@datapunt/matomo-tracker-react/lib/types';

function useOnScreen(ref) {
    const [isIntersecting, setIntersecting] = React.useState(false)
  
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting)
    )
  
    React.useEffect(() => {
      observer.observe(ref.current)
      // Remove the observer as soon as the component is unmounted
      return () => { observer.disconnect() }
    }, [])
  
    return isIntersecting
  }

interface TrackOnSightProps {
    category: string,
    action: string
    linger_seconds: number,
}

function TrackOnSight( {category, action, linger_seconds=0} : TrackOnSightProps ) {
    const { trackEvent } = useMatomo();
    let location = useLocation().pathname;

    React.useEffect(() => {
        trackEvent({
            category: category,
            action: action,
            name: 'test', // optional
            value: 123, // optional, numerical value
            documentTitle: 'Page title', // optional
            href: 'https://LINK.TO.PAGE', // optional
            customDimensions: [
                {
                  id: 1,
                  value: Meteor.user()?.profile.name
                },
                {
                  id: 2,
                  value: Meteor.user()?.profile.role
                },
            ]
          })

    }, [location]);

}


export default TrackOnSight;