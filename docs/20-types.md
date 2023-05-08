# Smart contract data types

The following diagram describes the contract types.  
[Ocaml conventions](https://stackoverflow.com/questions/29363460/whats-the-ocaml-naming-convention-for-constructors)
are followed by trying to have one type per module.

```mermaid
classDiagram
    Timelock <|-- Proposal
    Vote <|-- Proposal
    Proposal <|-- Outcome
    Outcome <|-- Storage
    Vault <|-- Storage
    Token <|-- Storage
    Proposal <|-- Storage
    Config <|-- Storage

    class Vault{
        type t
        getForUser(t, address) nat
        getForUserExn(t, address) nat
        updateForUser(t, address, nat) t
    }

    class Timelock{
        type t
        make(timestamp, nat) t
        isLocked(t) bool
        _checkUnlocked(t option) bool
        _checkLocked(t option) bool
    }

    class Token{
        type t
        getTransferEntrypoint(address) (FA2.transfer contract)
        transfer(t, address, address, nat) operation
        getTotalSupply(t) nat option
    }

    class Vote{
        type t
        count(votes) (nat * nat *nat)
    }
 
    class Outcome{
        type t
        make(Proposal.t, nat, nat, nat) t
        getProposal(t) (Proposal.t)
    }

    class Proposal{
        type t
        make()
        isVotingPeriod(t) bool
        _checkNotVotingPeriod(t) bool
        _checkIsVotingPeriod(t) bool
        _checkNoVoteOngoing(t) bool
        _checkVotingPeriodEnded(t) bool
    }

    class Config{
        type t
    }

    class Storage{
        type t
        initial_storage t
        createProposal(Proposal.t, t) t
        updateConfig(Lambda.parameterChange, t) t
        updateVault(Vault.t, t) t
        updateVotes(Proposal.t, Vote.t, t) t
        updateOutcome(nat, Outcome.t, t) t
        addOutcome(Outcome.t, t) t
    }
```
